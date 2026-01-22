# 使用官方 Nginx 镜像作为基础镜像
FROM nginx:1.2.5

# 将自定义的 nginx.conf 复制到容器中
COPY nginx.conf /etc/nginx/nginx.conf

# 将 Vue 应用构建的静态文件复制到 Nginx 默认根目录
COPY dist /usr/share/nginx/html

# 暴露 Nginx 默认端口
EXPOSE 80

# 启动 Nginx
CMD ["nginx", "-g", "daemon off;"]
