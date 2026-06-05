from pathlib import Path


BASE = Path(r"E:\houduan\director-video-service")


def write_text(path_str: str, content: str) -> None:
    path = BASE / path_str
    path.write_text(content, encoding="utf-8", newline="\n")


def patch_text(path_str: str, replacements: list[tuple[str, str]]) -> None:
    path = BASE / path_str
    content = path.read_text(encoding="utf-8")
    for old, new in replacements:
        if old not in content:
            raise RuntimeError(f"snippet not found in {path}: {old[:120]}")
        content = content.replace(old, new, 1)
    path.write_text(content, encoding="utf-8", newline="\n")


write_text(
    r"workflow\concatenation\task\factory.py",
    """# -*- coding: utf-8 -*-
from __future__ import annotations

import uuid

from material.models.CwConcatenationModels import CwConcatenationTask
from scheduling.service.task.task_common_utils import push_video_task_with_parent
from workflow.concatenation.model.constants import (
    NODE_STATUS_FAILED,
    NODE_STATUS_GENERATED,
    NODE_STATUS_GENERATING,
    TASK_STATUS_FAILED,
    TASK_STATUS_PENDING,
    TASK_STATUS_SUCCESS,
    TASK_TYPE_GENERATE,
    TASK_TYPE_SPLICE,
)
from workflow.concatenation.service.selector import ConcatenationStrategyRegistry


def safe_int(value, default=0):
    \"\"\"Safely convert mixed frontend values to integer.\"\"\"
    try:
        if value is None or value == '':
            return default
        return int(value)
    except Exception:
        return default


def safe_float(value, default=0.0):
    \"\"\"Safely convert mixed frontend values to float.\"\"\"
    try:
        if value is None or value == '':
            return default
        return float(value)
    except Exception:
        return default


def safe_bool(value, default=False):
    \"\"\"Safely convert mixed frontend values to bool.\"\"\"
    if value in (None, ''):
        return default
    if isinstance(value, bool):
        return value
    if isinstance(value, (int, float)):
        return bool(value)
    text = str(value).strip().lower()
    if text in ('1', 'true', 'yes', 'y', 'on'):
        return True
    if text in ('0', 'false', 'no', 'n', 'off'):
        return False
    return default


def get_generate_rule(node):
    \"\"\"Read normalized generate rule snapshot from plan node.\"\"\"
    return node.generate_rule_json or {}


def get_generate_configs(node):
    \"\"\"Read all configured generate configs for one generate node.\"\"\"
    rule = get_generate_rule(node)
    configs = rule.get('configs') or []
    return configs if isinstance(configs, list) else []


def build_generate_task_payload(plan, node, config, seq_no: int):
    \"\"\"Build one immutable execution payload for a single generate child task.\"\"\"
    rule = get_generate_rule(node)
    return {
        'seq_no': seq_no,
        'title': f'{plan.plan_name or "CW视频"}-{node.node_order}-{seq_no}',
        'script': rule.get('script') or rule.get('msg') or rule.get('content') or '',
        'language': rule.get('language') or 'zh',
        'speech_rate': safe_float(rule.get('speechRate') or rule.get('speech_rate'), 1),
        'anchor_type': safe_int(rule.get('anchorType') or rule.get('anchor_type'), 1),
        'is_skip_rs': safe_bool(rule.get('isSkipRs'), True),
        'is_allow_reverse': safe_bool(rule.get('isAllowReverse'), True),
        'resolution': safe_int(rule.get('resolution'), 1080),
        'digital_human_external_id': config.get('digitalHumanExternalId') or config.get('digitalHumanId') or '',
        'digital_human_local_id': config.get('digitalHumanLocalId') or '',
        'digital_human_name': config.get('digitalHumanName') or '',
        'voice_external_id': config.get('voiceExternalId') or config.get('voiceId') or '',
        'voice_local_id': config.get('voiceLocalId') or '',
        'voice_name': config.get('voiceName') or '',
        'relation_id': config.get('relationId') or '',
        'relation_name': config.get('relationName') or '',
        'cover_url': config.get('coverUrl') or '',
        'voice_url': config.get('voiceUrl') or '',
        'source_generate_rule': rule,
    }


def create_generate_audio_tasks(plan, node, parent_task_id: str):
    \"\"\"Create CW generate child tasks and push the audio step to audio worker.\"\"\"
    configs = get_generate_configs(node)
    task_ids = []
    if not configs:
        node.node_status = NODE_STATUS_FAILED
        node.generated_done = 0
        node.generate_total = 0
        node.error_message = '生成段未配置可执行的数字人/配音关系'
        node.save(update_fields=['node_status', 'generated_done', 'generate_total', 'error_message', 'update_time'])
        return task_ids

    node.node_status = NODE_STATUS_GENERATING
    node.generate_total = len(configs)
    node.generated_done = 0
    node.current_batch_no = plan.batch_no
    node.error_message = ''
    node.save(update_fields=['node_status', 'generate_total', 'generated_done', 'current_batch_no', 'error_message', 'update_time'])

    for seq_no, config in enumerate(configs, start=1):
        task = CwConcatenationTask.objects.create(
            plan_id=plan.id,
            plan_node_id=node.id,
            task_type=TASK_TYPE_GENERATE,
            task_status=TASK_STATUS_PENDING,
            task_no=f'CW-G-{plan.id}-{node.id}-{seq_no}',
            batch_no=plan.batch_no,
            output_folder_id=node.folder_id,
            input_payload=build_generate_task_payload(plan, node, config, seq_no),
        )
        audio_task_id = uuid.uuid4().hex[:8]
        task.sched_task_id = audio_task_id
        task.save(update_fields=['sched_task_id', 'update_time'])
        task_ids.append(task.id)

        push_video_task_with_parent(
            task_type='cw_concatenation_audio',
            task_id=audio_task_id,
            data_id=task.id,
            desc=f'CW生成音频-{plan.id}-{node.node_order}-{seq_no}',
            service='cw_concatenation_audio',
            parent_task_id=parent_task_id,
        )
    return task_ids


def push_generate_video_tasks(audio_events, parent_task_id: str):
    \"\"\"Push CW video step only for audio-success child tasks.\"\"\"
    pushed = []
    for event in audio_events:
        payload = event.get('payload') or {}
        cw_task_id = payload.get('cw_task_id')
        if event.get('status') != 'finished' or not cw_task_id:
            continue
        video_task_id = uuid.uuid4().hex[:8]
        task = CwConcatenationTask.objects.filter(id=cw_task_id).first()
        if task:
            task.sched_task_id = f'{task.sched_task_id or ""},{video_task_id}'.strip(',')
            task.save(update_fields=['sched_task_id', 'update_time'])
        push_video_task_with_parent(
            task_type='cw_concatenation_video',
            task_id=video_task_id,
            data_id=cw_task_id,
            desc=f'CW生成视频-{cw_task_id}',
            service='cw_concatenation_video',
            parent_task_id=parent_task_id,
        )
        pushed.append(int(cw_task_id))
    return pushed


def refresh_generate_node(node):
    \"\"\"Refresh generate node summary after all child tasks finish.\"\"\"
    success_count = CwConcatenationTask.objects.filter(
        plan_node_id=node.id,
        task_type=TASK_TYPE_GENERATE,
        task_status=TASK_STATUS_SUCCESS,
    ).count()
    failed_count = CwConcatenationTask.objects.filter(
        plan_node_id=node.id,
        task_type=TASK_TYPE_GENERATE,
        task_status=TASK_STATUS_FAILED,
    ).count()
    total_count = int(node.generate_total or 0)
    node.generated_done = success_count
    if success_count > 0:
        node.node_status = NODE_STATUS_GENERATED
    elif total_count > 0 and failed_count >= total_count:
        node.node_status = NODE_STATUS_FAILED
    else:
        node.node_status = NODE_STATUS_GENERATING
    if failed_count:
        node.error_message = f'生成完成，成功 {success_count} 条，失败 {failed_count} 条；后续拼接只使用成功素材'
    node.save(update_fields=['generated_done', 'node_status', 'error_message', 'update_time'])


def create_splice_tasks(plan, nodes, parent_task_id: str):
    \"\"\"Build splice groups and push one subtitle-worker task per output video.\"\"\"
    strategy = ConcatenationStrategyRegistry.get_strategy(plan.priority_mode)
    total_count = strategy.calculate_total_count(plan, nodes, plan.multiplier)
    if total_count <= 0:
        raise RuntimeError('没有可拼接素材，无法创建拼接任务')

    groups = strategy.build_groups(plan, nodes, total_count)
    task_ids = []
    for result_no, group in enumerate(groups, start=1):
        file_ids = [item.id for item in group]
        file_urls = [item.file_url for item in group]
        task = CwConcatenationTask.objects.create(
            plan_id=plan.id,
            plan_node_id=None,
            task_type=TASK_TYPE_SPLICE,
            task_status=TASK_STATUS_PENDING,
            task_no=f'CW-S-{plan.id}-{result_no}',
            batch_no=plan.batch_no,
            input_payload={
                'result_no': result_no,
                'input_file_ids': file_ids,
                'input_file_urls': file_urls,
            },
            output_folder_id=plan.output_folder_id,
        )
        splice_task_id = uuid.uuid4().hex[:8]
        task.sched_task_id = splice_task_id
        task.save(update_fields=['sched_task_id', 'update_time'])
        task_ids.append(task.id)
        push_video_task_with_parent(
            task_type='cw_concatenation_splice',
            task_id=splice_task_id,
            data_id=task.id,
            desc=f'CW多段剪辑拼接-{plan.id}-{result_no}',
            service='cw_concatenation_splice',
            parent_task_id=parent_task_id,
        )
    return task_ids
""",
)


write_text(
    r"scheduling\service\task\execute_cw_concatenation\cw_audio_task.py",
    """# -*- coding: utf-8 -*-
from __future__ import annotations

import copy
import logging
import time
import uuid

from api.service.VideoAPIService.VideoAPIService import VideoAPIService
from basics.utils import date_utils
from material.models.CwConcatenationModels import CwConcatenationTask
from scheduling.service.task.task_common_utils import (
    get_parent_task_id,
    redis_safe_dict,
    release_lock_with_lua,
    update_simple_task_status,
)
from scheduling.service.task_core import VOICE_TASK_TEMPLATE, redis_util
from workflow.concatenation.model.constants import TASK_STATUS_FAILED, TASK_STATUS_RUNNING
from workflow.concatenation.service.events import publish_cw_event

logger = logging.getLogger(__name__)


def _safe_float(value, default=1.0):
    \"\"\"Convert mixed frontend/backend number values into float.\"\"\"
    try:
        if value in (None, ''):
            return default
        return float(value)
    except Exception:
        return default


def _build_audio_api_payload(payload):
    \"\"\"Build third-party TTS request payload from one CW child task snapshot.\"\"\"
    language = payload.get('language') or 'zh'
    region = 'TH' if str(language).lower() == 'th' else 'CN'
    return {
        'msg': payload.get('script') or '',
        'user_voice_id': payload.get('voice_external_id') or '',
        'speech_rate': _safe_float(payload.get('speech_rate'), 1),
        'country': language,
        'region': region,
    }


def execute_cw_concatenation_audio(task_id, worker_id, data_id):
    \"\"\"Execute CW audio child task and publish one generate-audio event back to parent.\"\"\"
    lock_key = f'lock:cw_concatenation_audio:{task_id}'
    lock_value = f'{worker_id}:{uuid.uuid4().hex}'
    parent_task_id = get_parent_task_id('cw_concatenation_audio', task_id)
    task = None
    if not redis_util.set(lock_key, lock_value, nx=True, ex=3600):
        logger.info(f'[cw_audio] skip duplicate task_id={task_id}, data_id={data_id}')
        return
    try:
        task = CwConcatenationTask.objects.filter(id=data_id).first()
        if not task:
            raise RuntimeError(f'CW生成任务不存在: {data_id}')

        payload = task.input_payload or {}
        api_data = _build_audio_api_payload(payload)
        if not api_data['msg'] or not api_data['user_voice_id']:
            raise RuntimeError('音频生成参数缺少脚本或声音第三方ID')

        task.task_status = TASK_STATUS_RUNNING
        task.progress = 10
        task.started_at = task.started_at or date_utils.get_local_now()
        task.save(update_fields=['task_status', 'progress', 'started_at', 'update_time'])
        update_simple_task_status(worker_id, 'cw_concatenation_audio', task_id, 'processing', 10, 'CW生成音频处理中', data_id, None)

        voice_url = None
        for poll_index in range(0, 120):
            time.sleep(5)
            poll_resp = VideoAPIService.generate_voice_converted(**api_data)
            if poll_resp.get('audio_url'):
                voice_url = poll_resp.get('audio_url')
                break
            task.progress = min(20 + poll_index, 45)
            task.save(update_fields=['progress', 'update_time'])
            update_simple_task_status(worker_id, 'cw_concatenation_audio', task_id, 'processing', task.progress, f'CW生成音频轮询中{task.progress}%', data_id, None)

        if not voice_url:
            raise RuntimeError('音频生成超时')

        task.input_payload = dict(payload, audio_url=voice_url, audio_api_data=api_data)
        task.progress = 50
        task.save(update_fields=['input_payload', 'progress', 'update_time'])
        update_simple_task_status(worker_id, 'cw_concatenation_audio', task_id, 'finished', 100, 'CW生成音频完成', data_id, None)
        publish_cw_event(
            parent_task_id,
            step='generate_audio',
            status='finished',
            child_task_id=task_id,
            progress=50,
            payload={'cw_task_id': task.id, 'audio_url': voice_url},
        )
        logger.info(f'[cw_audio] finished task_id={task_id}, cw_task_id={task.id}')
    except Exception as err:
        logger.error(f'[cw_audio] failed task_id={task_id}, data_id={data_id}, err={err}', exc_info=True)
        if task:
            task.task_status = TASK_STATUS_FAILED
            task.error_message = str(err)
            task.finished_at = date_utils.get_local_now()
            task.save(update_fields=['task_status', 'error_message', 'finished_at', 'update_time'])
            cw_task_id = task.id
        else:
            cw_task_id = data_id
        update_simple_task_status(worker_id, 'cw_concatenation_audio', task_id, 'failed', 0, f'CW生成音频失败: {err}', data_id, None)
        publish_cw_event(
            parent_task_id,
            step='generate_audio',
            status='failed',
            child_task_id=task_id,
            progress=0,
            error_message=str(err),
            payload={'cw_task_id': cw_task_id},
        )
    finally:
        idle_obj = copy.deepcopy(VOICE_TASK_TEMPLATE)
        idle_obj['status'] = 'idle'
        redis_util.hmset(f'material:worker_status:{worker_id}', redis_safe_dict(idle_obj))
        release_lock_with_lua(lock_key, lock_value)
""",
)


write_text(
    r"scheduling\service\task\execute_cw_concatenation\cw_video_task.py",
    """# -*- coding: utf-8 -*-
from __future__ import annotations

import copy
import logging
import time
import uuid

from api.service.VideoAPIService.VideoAPIService import VideoAPIService
from basics.utils import date_utils
from basics.utils.minio_upload import MinIOUploadUtil
from material.models.CwConcatenationModels import CwConcatenationPlan, CwConcatenationPlanNode, CwConcatenationTask
from material.models.MediaFileModels import MediaFile
from scheduling.service.task.task_common_utils import (
    get_parent_task_id,
    redis_safe_dict,
    release_lock_with_lua,
    update_simple_task_status,
)
from scheduling.service.task_core import VOICE_TASK_TEMPLATE, redis_util
from scheduling.service.video_static import get_video_info
from user.models import User
from workflow.concatenation.model.constants import TASK_STATUS_FAILED, TASK_STATUS_RUNNING, TASK_STATUS_SUCCESS
from workflow.concatenation.service.events import publish_cw_event

logger = logging.getLogger(__name__)


def _safe_int(value, default=0):
    \"\"\"Convert mixed frontend/backend number values into int.\"\"\"
    try:
        if value in (None, ''):
            return default
        return int(value)
    except Exception:
        return default


def _safe_float(value, default=1.0):
    \"\"\"Convert mixed frontend/backend number values into float.\"\"\"
    try:
        if value in (None, ''):
            return default
        return float(value)
    except Exception:
        return default


def _safe_bool(value, default=False):
    \"\"\"Convert mixed frontend/backend values into bool.\"\"\"
    if value in (None, ''):
        return default
    if isinstance(value, bool):
        return value
    text = str(value).strip().lower()
    if text in ('1', 'true', 'yes', 'y', 'on'):
        return True
    if text in ('0', 'false', 'no', 'n', 'off'):
        return False
    return default


def _build_api_payload(plan, node, task):
    \"\"\"Build third-party video-generate payload from one CW child task snapshot.\"\"\"
    payload = task.input_payload or {}
    seq_no = payload.get('seq_no') or 1
    title = payload.get('title') or f'{plan.plan_name or "CW视频"}-{node.node_order}-{seq_no}'
    return {
        'title': title,
        'anchor_id': payload.get('digital_human_external_id') or '',
        'anchor_type': _safe_int(payload.get('anchor_type'), 1),
        'audioSrc': payload.get('audio_url') or '',
        'isSkipRs': _safe_bool(payload.get('is_skip_rs'), True),
        'isAllowReverse': _safe_bool(payload.get('is_allow_reverse'), True),
        'msg': payload.get('script') or '',
        'resolution': _safe_int(payload.get('resolution'), 1080),
        'isSubtitleEnabled': False,
        'speech_rate': _safe_float(payload.get('speech_rate'), 1),
    }


def execute_cw_concatenation_video(task_id, worker_id, data_id):
    \"\"\"Execute CW video child task and create one generated media_file on success.\"\"\"
    lock_key = f'lock:cw_concatenation_video:{task_id}'
    lock_value = f'{worker_id}:{uuid.uuid4().hex}'
    parent_task_id = get_parent_task_id('cw_concatenation_video', task_id)
    task = None
    if not redis_util.set(lock_key, lock_value, nx=True, ex=7200):
        logger.info(f'[cw_video] skip duplicate task_id={task_id}, data_id={data_id}')
        return
    try:
        task = CwConcatenationTask.objects.filter(id=data_id).first()
        if not task:
            raise RuntimeError(f'CW生成任务不存在: {data_id}')
        plan = CwConcatenationPlan.objects.filter(id=task.plan_id, deleted=False).first()
        node = CwConcatenationPlanNode.objects.filter(id=task.plan_node_id).first()
        if not plan or not node:
            raise RuntimeError('CW视频生成任务缺少计划或节点')

        api_payload = _build_api_payload(plan, node, task)
        if not api_payload.get('anchor_id') or not api_payload.get('audioSrc'):
            raise RuntimeError('视频生成参数缺少数字人第三方ID或音频地址')

        task.task_status = TASK_STATUS_RUNNING
        task.progress = 55
        task.save(update_fields=['task_status', 'progress', 'update_time'])
        update_simple_task_status(worker_id, 'cw_concatenation_video', task_id, 'processing', 55, 'CW生成视频处理中', data_id, None)

        submit_resp = VideoAPIService.generate_video_converted(api_payload)
        external_id = submit_resp.external_id
        task.input_payload = dict(task.input_payload or {}, external_id=external_id, video_api_payload=api_payload)
        task.save(update_fields=['input_payload', 'update_time'])

        video_cover_url = None
        video_url = None
        process = 55
        for _ in range(0, 90):
            time.sleep(10)
            poll_resp = VideoAPIService.query_video_generate_status_converted(external_id)[0]
            status = poll_resp.task_status
            process = poll_resp.process or process
            task.progress = min(max(_safe_int(process, 55), 55), 95)
            task.save(update_fields=['progress', 'update_time'])
            update_simple_task_status(worker_id, 'cw_concatenation_video', task_id, 'processing', task.progress, f'CW生成视频轮询中{task.progress}%', data_id, external_id)
            if status == 'success':
                video_cover_url = poll_resp.video_cover_url
                raw_video_url = poll_resp.video_url
                user_obj = User.objects.filter(user_id=plan.created_by, is_deleted=False).first()
                user_name = getattr(user_obj, 'username', None) or str(plan.created_by or 'unknown')
                minio_util = MinIOUploadUtil(bucket='base-video')
                video_url = minio_util.upload_from_url(
                    file_url=raw_video_url,
                    object_name=f'cw-concatenation/{user_name}/{plan.id}/{task.id}',
                )
                break
            if status in ('failed', 'fail'):
                raise RuntimeError('视频生成接口返回失败')

        if not video_url:
            raise RuntimeError('视频生成超时')

        video_info = get_video_info(video_url) or {}
        seq_no = (task.input_payload or {}).get('seq_no') or 1
        media_file = MediaFile.objects.create(
            user_id=plan.created_by,
            folder_id=node.folder_id,
            file_name=f'{api_payload.get("title")}.mp4',
            file_url=video_url,
            preview_url=video_cover_url,
            file_type='.mp4',
            duration=int(video_info.get('duration', 0) or 0),
            file_size=int(video_info.get('size', 0) or 0),
            cw_plan_id=plan.id,
            cw_plan_node_id=node.id,
            cw_task_id=task.id,
            cw_batch_no=plan.batch_no,
            cw_node_order=node.node_order,
            cw_seq_no=seq_no,
        )

        task.task_status = TASK_STATUS_SUCCESS
        task.progress = 100
        task.output_file_id = media_file.id
        task.finished_at = date_utils.get_local_now()
        task.save(update_fields=['task_status', 'progress', 'output_file_id', 'finished_at', 'update_time'])
        update_simple_task_status(worker_id, 'cw_concatenation_video', task_id, 'finished', 100, 'CW生成视频完成', data_id, external_id)
        publish_cw_event(
            parent_task_id,
            step='plan_generate',
            status='finished',
            child_task_id=task_id,
            progress=100,
            payload={'cw_task_id': task.id, 'media_file_id': media_file.id},
        )
        logger.info(f'[cw_video] success task_id={task_id}, cw_task_id={task.id}, media_file_id={media_file.id}')
    except Exception as err:
        logger.error(f'[cw_video] failed task_id={task_id}, data_id={data_id}, err={err}', exc_info=True)
        if task:
            task.task_status = TASK_STATUS_FAILED
            task.error_message = str(err)
            task.finished_at = date_utils.get_local_now()
            task.save(update_fields=['task_status', 'error_message', 'finished_at', 'update_time'])
            cw_task_id = task.id
        else:
            cw_task_id = data_id
        update_simple_task_status(worker_id, 'cw_concatenation_video', task_id, 'failed', 0, f'CW生成视频失败: {err}', data_id, None)
        publish_cw_event(
            parent_task_id,
            step='plan_generate',
            status='failed',
            child_task_id=task_id,
            progress=0,
            error_message=str(err),
            payload={'cw_task_id': cw_task_id},
        )
    finally:
        idle_obj = copy.deepcopy(VOICE_TASK_TEMPLATE)
        idle_obj['status'] = 'idle'
        redis_util.hmset(f'material:worker_status:{worker_id}', redis_safe_dict(idle_obj))
        release_lock_with_lua(lock_key, lock_value)
""",
)


write_text(
    r"scheduling\service\task\execute_cw_concatenation\cw_splice_task.py",
    """# -*- coding: utf-8 -*-
from __future__ import annotations

import copy
import logging
import time
import uuid

from api.service.VideoAPIService.VideoAPIService import VideoAPIService
from basics.utils import date_utils
from material.models.CwConcatenationModels import CwConcatenationPlan, CwConcatenationResult, CwConcatenationTask
from material.models.MediaFileModels import MediaFile
from scheduling.service.task.task_common_utils import (
    get_parent_task_id,
    redis_safe_dict,
    release_lock_with_lua,
    update_simple_task_status,
)
from scheduling.service.task_core import VOICE_TASK_TEMPLATE, redis_util
from scheduling.service.video_static import get_video_info
from workflow.concatenation.model.constants import TASK_STATUS_FAILED, TASK_STATUS_RUNNING, TASK_STATUS_SUCCESS
from workflow.concatenation.service.events import publish_cw_event
from workflow.concatenation.service.selector import PairUsageMixin

logger = logging.getLogger(__name__)


def _safe_str(value):
    \"\"\"Decode redis bytes into plain string when needed.\"\"\"
    if isinstance(value, (bytes, bytearray)):
        return value.decode()
    return value


def _poll_concat_result(result_id, task_service='cw_concatenation_splice', timeout_seconds=3600):
    \"\"\"Poll concat service callback result from redis result keys.\"\"\"
    keys = [
        f'video:post-production:concat_add:{result_id}',
        f'video:post-production:{task_service}:{result_id}',
    ]
    deadline = time.time() + timeout_seconds
    while time.time() < deadline:
        time.sleep(10)
        for key in keys:
            data = redis_util.hgetall(key) or {}
            if not data:
                continue
            status = _safe_str(data.get('step1_status') or data.get(b'step1_status') or '')
            if status == '2':
                return _safe_str(data.get('output_url') or data.get(b'output_url') or '')
            if status in ('-1', 'failed', 'fail'):
                raise RuntimeError('拼接服务返回失败')
    raise RuntimeError('拼接服务回调超时')


def execute_cw_concatenation_splice(task_id, worker_id, data_id):
    \"\"\"Execute one CW splice child task and create output records on success.\"\"\"
    lock_key = f'lock:cw_concatenation_splice:{task_id}'
    lock_value = f'{worker_id}:{uuid.uuid4().hex}'
    if not redis_util.set(lock_key, lock_value, nx=True, ex=7200):
        logger.info(f'[cw_splice] skip duplicate task_id={task_id}, data_id={data_id}')
        return

    task = None
    result = None
    parent_task_id = get_parent_task_id('cw_concatenation_splice', task_id)
    try:
        task = CwConcatenationTask.objects.filter(id=data_id).first()
        if not task:
            raise RuntimeError(f'CW拼接任务不存在: {data_id}')
        plan = CwConcatenationPlan.objects.filter(id=task.plan_id, deleted=False).first()
        if not plan:
            raise RuntimeError('CW拼接任务缺少计划')

        payload = task.input_payload or {}
        file_ids = payload.get('input_file_ids') or []
        file_urls = payload.get('input_file_urls') or []
        result_no = payload.get('result_no') or 1
        if not file_urls:
            raise RuntimeError('拼接任务缺少输入视频')

        now = date_utils.get_local_now()
        task.task_status = TASK_STATUS_RUNNING
        task.started_at = now
        task.progress = 5
        task.save(update_fields=['task_status', 'started_at', 'progress', 'update_time'])
        update_simple_task_status(worker_id, 'cw_concatenation_splice', task_id, 'processing', 5, 'CW拼接处理中', data_id, None)

        result = CwConcatenationResult.objects.create(
            plan_id=plan.id,
            task_id=task.id,
            result_no=result_no,
            input_file_ids=file_ids,
            input_file_urls=file_urls,
            result_status='running',
        )

        VideoAPIService.video_concat_add(
            data_id=result.id,
            video_urls=file_urls,
            username=str(plan.created_by or 'system'),
            task_service='cw_concatenation_splice',
        )
        output_url = _poll_concat_result(result.id, task_service='cw_concatenation_splice')
        if not output_url:
            raise RuntimeError('拼接完成但没有返回 output_url')

        video_info = get_video_info(output_url) or {}
        output_file = MediaFile.objects.create(
            user_id=plan.created_by,
            folder_id=plan.output_folder_id,
            file_name=f'{plan.plan_name or "CW成片"}-{result_no}.mp4',
            file_url=output_url,
            preview_url='',
            file_type='.mp4',
            duration=int(video_info.get('duration', 0) or 0),
            file_size=int(video_info.get('size', 0) or 0),
            cw_plan_id=plan.id,
            cw_task_id=task.id,
            cw_batch_no=plan.batch_no,
            cw_seq_no=result_no,
        )

        result.output_file_id = output_file.id
        result.output_url = output_url
        result.duration = output_file.duration or 0
        result.result_status = 'success'
        result.save(update_fields=['output_file_id', 'output_url', 'duration', 'result_status', 'update_time'])

        PairUsageMixin.record_pair_usage(file_ids, plan.id, task.id)

        task.task_status = TASK_STATUS_SUCCESS
        task.progress = 100
        task.output_file_id = output_file.id
        task.finished_at = date_utils.get_local_now()
        task.save(update_fields=['task_status', 'progress', 'output_file_id', 'finished_at', 'update_time'])
        update_simple_task_status(worker_id, 'cw_concatenation_splice', task_id, 'finished', 100, 'CW拼接完成', data_id, None)
        publish_cw_event(
            parent_task_id,
            step='plan_splice',
            status='finished',
            child_task_id=task_id,
            progress=100,
            payload={'cw_task_id': task.id, 'result_id': result.id, 'output_file_id': output_file.id},
        )
        logger.info(f'[cw_splice] success task_id={task_id}, result_id={result.id}, output_file_id={output_file.id}')

    except Exception as err:
        logger.error(f'[cw_splice] failed task_id={task_id}, data_id={data_id}, err={err}', exc_info=True)
        if result:
            result.result_status = 'failed'
            result.error_message = str(err)
            result.save(update_fields=['result_status', 'error_message', 'update_time'])
        if task:
            task.task_status = TASK_STATUS_FAILED
            task.error_message = str(err)
            task.finished_at = date_utils.get_local_now()
            task.save(update_fields=['task_status', 'error_message', 'finished_at', 'update_time'])
            cw_task_id = task.id
        else:
            cw_task_id = data_id
        update_simple_task_status(worker_id, 'cw_concatenation_splice', task_id, 'failed', 0, f'CW拼接失败: {err}', data_id, None)
        publish_cw_event(
            parent_task_id,
            step='plan_splice',
            status='failed',
            child_task_id=task_id,
            progress=0,
            error_message=str(err),
            payload={'cw_task_id': cw_task_id},
        )
    finally:
        idle_obj = copy.deepcopy(VOICE_TASK_TEMPLATE)
        idle_obj['status'] = 'idle'
        redis_util.hmset(f'material:worker_status:{worker_id}', redis_safe_dict(idle_obj))
        release_lock_with_lua(lock_key, lock_value)
""",
)


write_text(
    r"workflow\concatenation\scheduling\executor.py",
    """# -*- coding: utf-8 -*-
from __future__ import annotations

import copy
import logging
import uuid

from basics.utils import date_utils
from material.models.CwConcatenationModels import CwConcatenationPlan, CwConcatenationPlanNode, CwConcatenationTask
from scheduling.service.task.task_common_utils import redis_safe_dict, release_lock_with_lua
from scheduling.service.task_core import VIDEO_TASK, redis_util, status_key
from workflow.concatenation.model.constants import (
    NODE_STATUS_COMPLETED,
    NODE_STATUS_FAILED,
    NODE_STATUS_GENERATED,
    NODE_STATUS_PENDING,
    NODE_STATUS_SPLICING,
    PLAN_STATUS_COMPLETED,
    PLAN_STATUS_FAILED,
    PLAN_STATUS_RUNNING_GENERATE,
    PLAN_STATUS_RUNNING_SPLICE,
    PLAN_STATUS_WAITING_SPLICE,
    TASK_STATUS_FAILED,
    TASK_STATUS_SUCCESS,
    TASK_TYPE_GENERATE,
    TASK_TYPE_SPLICE,
)
from workflow.concatenation.service.events import cleanup_cw_result_queue, wait_cw_events
from workflow.concatenation.task.factory import (
    create_generate_audio_tasks,
    create_splice_tasks,
    push_generate_video_tasks,
    refresh_generate_node,
)

logger = logging.getLogger(__name__)


def _decode_map(data):
    \"\"\"Decode redis bytes map into plain string dictionary.\"\"\"
    return {
        (key.decode() if isinstance(key, (bytes, bytearray)) else key):
        (value.decode() if isinstance(value, (bytes, bytearray)) else value)
        for key, value in (data or {}).items()
    }


def _update_cw_status(worker_id, task_id, step, step_status, progress, data_id, desc, extra=None, overall_status='processing'):
    \"\"\"Update CW complex task redis state for both task-status and worker-status views.\"\"\"
    task_key = status_key('cw_concatenation_execute', task_id)
    worker_key = f'material:worker_status:{worker_id}'
    old_task = _decode_map(redis_util.hgetall(task_key) or {})
    old_worker = _decode_map(redis_util.hgetall(worker_key) or {})
    base_obj = old_task or old_worker or copy.deepcopy(VIDEO_TASK)
    base_obj['task_id'] = task_id
    base_obj['data_id'] = data_id
    base_obj['type'] = 'cw_concatenation_execute'
    base_obj['status'] = overall_status
    base_obj['desc'] = desc or base_obj.get('desc', '')
    if step == 1:
        base_obj['step1_type'] = 'cw_generate'
        base_obj['step1_status'] = step_status
        base_obj['step1_progress'] = progress
    elif step == 2:
        base_obj['step2_type'] = 'cw_splice'
        base_obj['step2_status'] = step_status
        base_obj['step2_progress'] = progress
    if extra:
        base_obj.update(extra)
    safe_obj = redis_safe_dict(base_obj)
    redis_util.hmset(task_key, safe_obj)
    redis_util.hmset(worker_key, safe_obj)


def _prepare_plan(plan):
    \"\"\"Initialize plan runtime fields before CW complex task starts.\"\"\"
    if not plan.batch_no:
        plan.batch_no = uuid.uuid4().hex[:12]
    if not plan.run_time:
        plan.run_time = date_utils.get_local_now()
    plan.plan_status = PLAN_STATUS_RUNNING_GENERATE
    plan.save(update_fields=['batch_no', 'run_time', 'plan_status', 'update_time'])


def _load_plan_nodes(plan):
    \"\"\"Load plan node snapshots before generate/splice stage starts.\"\"\"
    nodes = list(CwConcatenationPlanNode.objects.filter(plan_id=plan.id).order_by('node_order', 'id'))
    if not nodes:
        raise RuntimeError('计划没有节点，无法执行')
    return nodes


def _run_generate_stage(plan, nodes, parent_task_id):
    \"\"\"Push audio/video children, wait their events, then refresh generate node summaries.\"\"\"
    generate_task_ids = []
    for node in nodes:
        if node.node_role == TASK_TYPE_GENERATE:
            generate_task_ids.extend(create_generate_audio_tasks(plan, node, parent_task_id))

    if not generate_task_ids:
        return {'total': 0, 'success': 0, 'failed': 0}

    audio_events = wait_cw_events(parent_task_id, 'generate_audio', expected_count=len(generate_task_ids), timeout_seconds=7200)
    if len(audio_events) < len(generate_task_ids):
        raise RuntimeError(f'等待生成音频结果超时：期望 {len(generate_task_ids)} 条，收到 {len(audio_events)} 条')

    video_task_ids = push_generate_video_tasks(audio_events, parent_task_id)
    if video_task_ids:
        video_events = wait_cw_events(parent_task_id, 'plan_generate', expected_count=len(video_task_ids), timeout_seconds=7200)
        if len(video_events) < len(video_task_ids):
            raise RuntimeError(f'等待生成视频结果超时：期望 {len(video_task_ids)} 条，收到 {len(video_events)} 条')

    for node in nodes:
        if node.node_role == TASK_TYPE_GENERATE:
            refresh_generate_node(node)

    success_count = CwConcatenationTask.objects.filter(
        plan_id=plan.id,
        task_type=TASK_TYPE_GENERATE,
        task_status=TASK_STATUS_SUCCESS,
    ).count()
    failed_count = CwConcatenationTask.objects.filter(
        plan_id=plan.id,
        task_type=TASK_TYPE_GENERATE,
        task_status=TASK_STATUS_FAILED,
    ).count()
    return {'total': len(generate_task_ids), 'success': success_count, 'failed': failed_count}


def _mark_generate_finished(plan):
    \"\"\"Mark generate stage finished so the plan can enter splice stage.\"\"\"
    plan.generate_finished_at = date_utils.get_local_now()
    plan.plan_status = PLAN_STATUS_WAITING_SPLICE
    plan.save(update_fields=['generate_finished_at', 'plan_status', 'update_time'])


def _mark_nodes_splicing(nodes):
    \"\"\"Mark splice-related nodes as splicing for frontend stage display.\"\"\"
    for node in nodes:
        if node.node_status in (NODE_STATUS_PENDING, NODE_STATUS_GENERATED):
            node.node_status = NODE_STATUS_SPLICING
            node.save(update_fields=['node_status', 'update_time'])


def _run_splice_stage(plan, nodes, parent_task_id):
    \"\"\"Create splice tasks, wait all splice events, and return stage summary.\"\"\"
    plan.plan_status = PLAN_STATUS_RUNNING_SPLICE
    plan.splice_started_at = date_utils.get_local_now()
    plan.save(update_fields=['plan_status', 'splice_started_at', 'update_time'])

    splice_task_ids = create_splice_tasks(plan, nodes, parent_task_id)
    splice_events = wait_cw_events(parent_task_id, 'plan_splice', expected_count=len(splice_task_ids), timeout_seconds=10800)
    if len(splice_events) < len(splice_task_ids):
        raise RuntimeError(f'等待拼接结果超时：期望 {len(splice_task_ids)} 条，收到 {len(splice_events)} 条')
    success_count = len([event for event in splice_events if event.get('status') == 'finished'])
    failed_count = len(splice_events) - success_count
    return splice_task_ids, splice_events, {'total': len(splice_task_ids), 'success': success_count, 'failed': failed_count}


def _finish_plan(plan, nodes, splice_summary):
    \"\"\"Write final plan/node statuses after splice stage finishes.\"\"\"
    success_count = splice_summary.get('success', 0)
    failed_count = splice_summary.get('failed', 0)

    for node in nodes:
        if node.node_role == TASK_TYPE_SPLICE:
            node.splice_done = success_count
        node.node_status = NODE_STATUS_COMPLETED if success_count > 0 else NODE_STATUS_FAILED
        if failed_count:
            node.error_message = f'拼接完成，成功 {success_count} 条，失败 {failed_count} 条'
        node.save(update_fields=['splice_done', 'node_status', 'error_message', 'update_time'])

    plan.plan_status = PLAN_STATUS_COMPLETED if success_count > 0 else PLAN_STATUS_FAILED
    plan.error_message = '' if failed_count == 0 else f'部分任务失败：拼接成功 {success_count} 条，失败 {failed_count} 条'
    plan.end_time = date_utils.get_local_now()
    plan.save(update_fields=['plan_status', 'error_message', 'end_time', 'update_time'])
    logger.info(f'[cw_execute] finished plan_id={plan.id}, success={success_count}, failed={failed_count}')


def _fail_plan(plan, err):
    \"\"\"Mark plan failed when the CW complex task raises any fatal exception.\"\"\"
    if not plan:
        return
    plan.plan_status = PLAN_STATUS_FAILED
    plan.error_message = str(err)
    plan.end_time = date_utils.get_local_now()
    plan.save(update_fields=['plan_status', 'error_message', 'end_time', 'update_time'])


def execute_cw_concatenation(task_id, worker_id, data_id):
    \"\"\"Execute CW complex workflow: generate first, then splice.\"\"\"
    lock_key = f'lock:cw_concatenation_execute:{task_id}'
    lock_value = f'{worker_id}:{uuid.uuid4().hex}'
    if not redis_util.set(lock_key, lock_value, nx=True, ex=10800):
        logger.info(f'[cw_execute] skip duplicate task_id={task_id}, data_id={data_id}')
        return

    plan = None
    try:
        _update_cw_status(worker_id, task_id, 1, 'processing', 0, data_id, '多段编辑生成处理中', extra={
            'generate_total': 0,
            'generate_success': 0,
            'generate_failed': 0,
            'splice_total': 0,
            'splice_success': 0,
            'splice_failed': 0,
            'current_phase': 'generate',
        })

        plan = CwConcatenationPlan.objects.filter(id=data_id, deleted=False).first()
        if not plan:
            raise RuntimeError(f'计划不存在: {data_id}')

        _prepare_plan(plan)
        nodes = _load_plan_nodes(plan)
        generate_summary = _run_generate_stage(plan, nodes, task_id)
        _update_cw_status(worker_id, task_id, 1, 'finished', 100, data_id, '多段编辑生成完成', extra={
            'generate_total': generate_summary.get('total', 0),
            'generate_success': generate_summary.get('success', 0),
            'generate_failed': generate_summary.get('failed', 0),
            'current_phase': 'generate_finished',
        })

        _mark_generate_finished(plan)
        _mark_nodes_splicing(nodes)
        _update_cw_status(worker_id, task_id, 2, 'processing', 0, data_id, '多段编辑拼接处理中', extra={
            'current_phase': 'splice',
        })

        _, _, splice_summary = _run_splice_stage(plan, nodes, task_id)
        _finish_plan(plan, nodes, splice_summary)
        _update_cw_status(worker_id, task_id, 2, 'finished', 100, data_id, '多段编辑拼接完成', extra={
            'splice_total': splice_summary.get('total', 0),
            'splice_success': splice_summary.get('success', 0),
            'splice_failed': splice_summary.get('failed', 0),
            'current_phase': 'finished',
        }, overall_status='finished')
    except Exception as err:
        logger.error(f'[cw_execute] failed task_id={task_id}, data_id={data_id}, err={err}', exc_info=True)
        _fail_plan(plan, err)
        _update_cw_status(worker_id, task_id, 2, 'failed', 0, data_id, f'多段编辑任务失败: {err}', extra={
            'current_phase': 'failed',
        }, overall_status='failed')
    finally:
        cleanup_cw_result_queue(task_id)
        release_lock_with_lua(lock_key, lock_value)
""",
)


patch_text(
    r"scheduling\service\mq_dispatcher.py",
    [
        (
            """    # 音频 worker：按 dispatcher 既定顺序轮询
    audio_priorities = [
        (AUDIO_CLONE_QUEUE, mq_handle_task.execute_audio_pool_task),
        (TASK_QUEUE_MAP["audio_dubbing"], mq_handle_task.execute_audio_pool_task),
        (AUDIO_PREVIEW_IMMEDIATE_QUEUE, mq_handle_task.execute_audio_pool_task),
        (TASK_QUEUE_MAP["audio_preview_scheduled"], mq_handle_task.execute_audio_pool_task),
        (TASK_QUEUE_MAP["cw_concatenation_audio"], execute_cw_concatenation_audio),
        (TASK_QUEUE_MAP["audio_reset_clone"], mq_handle_task.execute_audio_pool_task),
    ]
""",
            """    # 音频 worker：优先级 = clone > dubbing > preview_immediate > preview_scheduled > reset_clone > cw_audio
    audio_priorities = [
        (AUDIO_CLONE_QUEUE, mq_handle_task.execute_audio_pool_task),
        (TASK_QUEUE_MAP["audio_dubbing"], mq_handle_task.execute_audio_pool_task),
        (AUDIO_PREVIEW_IMMEDIATE_QUEUE, mq_handle_task.execute_audio_pool_task),
        (TASK_QUEUE_MAP["audio_preview_scheduled"], mq_handle_task.execute_audio_pool_task),
        (TASK_QUEUE_MAP["audio_reset_clone"], mq_handle_task.execute_audio_pool_task),
        (TASK_QUEUE_MAP["cw_concatenation_audio"], execute_cw_concatenation_audio),
    ]
""",
        ),
        (
            """    # 公共 worker：优先级 = avatar_clone_not_voice > avatar_clone > avatar_reset_clone > video_by_voice_realtime > video_realtime > video_scheduled > video_optimize
    common_priorities = [
        (TASK_QUEUE_MAP["avatar_clone_not_voice"], mq_handle_task.execute_avatar_clone_not_voice),
        (TASK_QUEUE_MAP["avatar_clone"], mq_handle_task.execute_avatar_clone),
        (TASK_QUEUE_MAP["avatar_clone_image"], mq_handle_task.execute_avatar_clone_image),
        (TASK_QUEUE_MAP["avatar_reset_clone"], mq_handle_task.execute_reset_avatar_clone),
        (TASK_QUEUE_MAP["video_by_voice_realtime"], mq_handle_task.execute_video_realtime_by_voice),
        (TASK_QUEUE_MAP["video_realtime"], video_realtime_executor),
        (TASK_QUEUE_MAP["cw_concatenation_video"], execute_cw_concatenation_video),
        (TASK_QUEUE_MAP["video_scheduled"], mq_handle_task.execute_video_scheduled),
        (TASK_QUEUE_MAP["video_optimize"], mq_handle_task.execute_video_optimize),
    ]
""",
            """    # 公共 worker：优先级 = avatar_clone_not_voice > avatar_clone > avatar_clone_image > avatar_reset_clone > video_by_voice_realtime > video_realtime > video_scheduled > video_optimize > cw_video
    common_priorities = [
        (TASK_QUEUE_MAP["avatar_clone_not_voice"], mq_handle_task.execute_avatar_clone_not_voice),
        (TASK_QUEUE_MAP["avatar_clone"], mq_handle_task.execute_avatar_clone),
        (TASK_QUEUE_MAP["avatar_clone_image"], mq_handle_task.execute_avatar_clone_image),
        (TASK_QUEUE_MAP["avatar_reset_clone"], mq_handle_task.execute_reset_avatar_clone),
        (TASK_QUEUE_MAP["video_by_voice_realtime"], mq_handle_task.execute_video_realtime_by_voice),
        (TASK_QUEUE_MAP["video_realtime"], video_realtime_executor),
        (TASK_QUEUE_MAP["video_scheduled"], mq_handle_task.execute_video_scheduled),
        (TASK_QUEUE_MAP["video_optimize"], mq_handle_task.execute_video_optimize),
        (TASK_QUEUE_MAP["cw_concatenation_video"], execute_cw_concatenation_video),
    ]
""",
        ),
        (
            """    # 字幕 worker：优先级 = concat_add > corner_mark_add > video_subtitle > video_subtitle_remove
    subtitle_priorities = [
        (TASK_QUEUE_MAP["cw_concatenation_splice"], execute_cw_concatenation_splice),
        (TASK_QUEUE_MAP["concat_add"], execute_video_concat_add),
        (TASK_QUEUE_MAP["corner_mark_add"], execute_corner_mark_add),
        (TASK_QUEUE_MAP["video_subtitle"], execute_video_subtitle),
        (TASK_QUEUE_MAP["video_subtitle_remove"], execute_video_subtitle_remove),
    ]
""",
            """    # 字幕 worker：优先级 = concat_add > corner_mark_add > video_subtitle > video_subtitle_remove > cw_splice
    subtitle_priorities = [
        (TASK_QUEUE_MAP["concat_add"], execute_video_concat_add),
        (TASK_QUEUE_MAP["corner_mark_add"], execute_corner_mark_add),
        (TASK_QUEUE_MAP["video_subtitle"], execute_video_subtitle),
        (TASK_QUEUE_MAP["video_subtitle_remove"], execute_video_subtitle_remove),
        (TASK_QUEUE_MAP["cw_concatenation_splice"], execute_cw_concatenation_splice),
    ]
""",
        ),
        (
            """    # 复杂编排 worker：按 dispatcher 既定顺序 quick > immediate > scheduled
    complex_priorities = [
        (TASK_QUEUE_MAP["decompose_quick"], mq_handle_task.execute_complex_quick),
        (TASK_QUEUE_MAP["decompose_immediate"], complex_immediate_executor),
        (TASK_QUEUE_MAP["cw_concatenation_execute"], execute_cw_concatenation),
        (TASK_QUEUE_MAP["decompose_scheduled"], mq_handle_task.execute_complex_scheduled),
    ]
""",
            """    # 复杂编排 worker：优先级 = quick > immediate > scheduled > cw_execute
    complex_priorities = [
        (TASK_QUEUE_MAP["decompose_quick"], mq_handle_task.execute_complex_quick),
        (TASK_QUEUE_MAP["decompose_immediate"], complex_immediate_executor),
        (TASK_QUEUE_MAP["decompose_scheduled"], mq_handle_task.execute_complex_scheduled),
        (TASK_QUEUE_MAP["cw_concatenation_execute"], execute_cw_concatenation),
    ]
""",
        ),
    ],
)


print("patched cw backend files")
