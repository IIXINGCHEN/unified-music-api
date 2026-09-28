#!/bin/bash

# Music API Proxy 增强部署脚本
# 支持Docker、Docker Compose和Kubernetes多种部署方式

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 项目根目录
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

# 默认配置
DEFAULT_ENV="production"
DEFAULT_VERSION="latest"
DEFAULT_NAMESPACE="music-api-proxy"

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查依赖
check_dependencies() {
    local deployment_type=$1
    
    case $deployment_type in
        docker)
            if ! command -v docker &> /dev/null; then
                log_error "Docker未安装"
                exit 1
            fi
            ;;
        compose)
            if ! command -v docker &> /dev/null; then
                log_error "Docker未安装"
                exit 1
            fi
            if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
                log_error "Docker Compose未安装"
                exit 1
            fi
            ;;
        k8s|kubernetes)
            if ! command -v kubectl &> /dev/null; then
                log_error "kubectl未安装"
                exit 1
            fi
            ;;
    esac
}

# 构建Docker镜像
build_docker_image() {
    local version=${1:-$DEFAULT_VERSION}
    local image_name="music-api-proxy:$version"
    
    log_info "构建Docker镜像: $image_name"
    
    docker build -t "$image_name" .
    
    if [ $? -eq 0 ]; then
        log_success "Docker镜像构建成功: $image_name"
    else
        log_error "Docker镜像构建失败"
        exit 1
    fi
}

# Docker部署
deploy_docker() {
    local version=${1:-$DEFAULT_VERSION}
    local env=${2:-$DEFAULT_ENV}
    local port=${3:-5678}
    
    log_info "使用Docker部署Music API Proxy"
    
    # 构建镜像
    build_docker_image "$version"
    
    # 停止现有容器
    if docker ps -q -f name=unm-server | grep -q .; then
        log_info "停止现有容器"
        docker stop unm-server
        docker rm unm-server
    fi
    
    # 创建必要的目录
    mkdir -p logs data cache
    
    # 启动新容器
    log_info "启动新容器"
    docker run -d \
        --name unm-server \
        --restart unless-stopped \
        -p "$port:5678" \
        -p "9090:9090" \
        -e UNM_ENV="$env" \
        -v "$PROJECT_ROOT/config:/app/config:ro" \
        -v "$PROJECT_ROOT/logs:/app/logs" \
        -v "$PROJECT_ROOT/data:/app/data" \
        -v "$PROJECT_ROOT/cache:/app/cache" \
        "unm-server:$version"
    
    # 等待服务启动
    log_info "等待服务启动..."
    sleep 10
    
    # 健康检查
    if curl -f http://localhost:$port/health > /dev/null 2>&1; then
        log_success "Music API Proxy部署成功，访问地址: http://localhost:$port"
    else
        log_error "Music API Proxy部署失败，健康检查未通过"
        docker logs unm-server
        exit 1
    fi
}

# Docker Compose部署
deploy_compose() {
    local version=${1:-$DEFAULT_VERSION}
    local env=${2:-$DEFAULT_ENV}
    
    log_info "使用Docker Compose部署Music API Proxy"
    
    # 检查docker-compose.yml文件
    if [ ! -f "docker-compose.yml" ]; then
        log_error "docker-compose.yml文件不存在"
        exit 1
    fi
    
    # 设置环境变量
    export UNM_VERSION="$version"
    export UNM_ENV="$env"
    
    # 创建必要的目录
    mkdir -p logs data cache config/ssl config/grafana/dashboards
    
    # 构建并启动服务
    log_info "构建并启动服务"
    if command -v docker-compose &> /dev/null; then
        docker-compose down
        docker-compose build
        docker-compose up -d
    else
        docker compose down
        docker compose build
        docker compose up -d
    fi
    
    # 等待服务启动
    log_info "等待服务启动..."
    sleep 30
    
    # 健康检查
    if curl -f http://localhost:5678/health > /dev/null 2>&1; then
        log_success "Music API Proxy部署成功"
        log_info "Music API Proxy访问地址: http://localhost:5678"
        log_info "Grafana访问地址: http://localhost:3000 (admin/admin)"
        log_info "Prometheus访问地址: http://localhost:9091"
    else
        log_error "Music API Proxy部署失败，健康检查未通过"
        if command -v docker-compose &> /dev/null; then
            docker-compose logs unm-server
        else
            docker compose logs unm-server
        fi
        exit 1
    fi
}

# Kubernetes部署
deploy_kubernetes() {
    local version=${1:-$DEFAULT_VERSION}
    local namespace=${2:-$DEFAULT_NAMESPACE}
    local env=${3:-$DEFAULT_ENV}
    
    log_info "使用Kubernetes部署Music API Proxy"
    
    # 检查kubectl连接
    if ! kubectl cluster-info > /dev/null 2>&1; then
        log_error "无法连接到Kubernetes集群"
        exit 1
    fi
    
    # 创建命名空间
    log_info "创建命名空间: $namespace"
    kubectl apply -f k8s/namespace.yaml
    
    # 应用配置
    log_info "应用配置文件"
    kubectl apply -f k8s/configmap.yaml
    kubectl apply -f k8s/secret.yaml
    
    # 应用存储
    log_info "应用存储配置"
    kubectl apply -f k8s/storage.yaml
    
    # 更新镜像版本
    if [ "$version" != "latest" ]; then
        log_info "更新镜像版本为: $version"
        sed -i.bak "s|image: unm-server:.*|image: unm-server:$version|g" k8s/deployment.yaml
    fi
    
    # 应用部署
    log_info "应用部署配置"
    kubectl apply -f k8s/deployment.yaml
    kubectl apply -f k8s/service.yaml
    kubectl apply -f k8s/ingress.yaml
    
    # 等待部署完成
    log_info "等待部署完成..."
    kubectl rollout status deployment/unm-server -n "$namespace" --timeout=300s
    
    # 获取服务信息
    log_info "获取服务信息"
    kubectl get pods -n "$namespace"
    kubectl get services -n "$namespace"
    
    # 获取访问地址
    local nodeport=$(kubectl get service unm-server-nodeport -n "$namespace" -o jsonpath='{.spec.ports[0].nodePort}' 2>/dev/null || echo "")
    local node_ip=$(kubectl get nodes -o jsonpath='{.items[0].status.addresses[?(@.type=="ExternalIP")].address}' 2>/dev/null || echo "")
    
    if [ -z "$node_ip" ]; then
        node_ip=$(kubectl get nodes -o jsonpath='{.items[0].status.addresses[?(@.type=="InternalIP")].address}' 2>/dev/null || echo "localhost")
    fi
    
    log_success "Music API Proxy部署成功"
    if [ -n "$nodeport" ]; then
        log_info "NodePort访问地址: http://$node_ip:$nodeport"
    fi
    log_info "集群内访问地址: http://unm-server-service.$namespace.svc.cluster.local:5678"
    
    # 恢复deployment.yaml
    if [ -f "k8s/deployment.yaml.bak" ]; then
        mv k8s/deployment.yaml.bak k8s/deployment.yaml
    fi
}

# 停止部署
stop_deployment() {
    local deployment_type=$1
    
    case $deployment_type in
        docker)
            log_info "停止Docker部署"
            docker stop unm-server || true
            docker rm unm-server || true
            ;;
        compose)
            log_info "停止Docker Compose部署"
            if command -v docker-compose &> /dev/null; then
                docker-compose down
            else
                docker compose down
            fi
            ;;
        k8s|kubernetes)
            log_info "停止Kubernetes部署"
            local namespace=${2:-$DEFAULT_NAMESPACE}
            kubectl delete -f k8s/ || true
            ;;
    esac
}

# 显示帮助信息
show_help() {
    cat << EOF
Music API Proxy 增强部署脚本

用法: $0 <命令> <部署类型> [选项]

命令:
    deploy      部署服务
    stop        停止服务
    build       构建镜像
    help        显示帮助信息

部署类型:
    docker      Docker容器部署
    compose     Docker Compose部署
    k8s         Kubernetes部署

选项:
    -v, --version <版本>     指定版本 (默认: latest)
    -e, --env <环境>         指定环境 (默认: production)
    -n, --namespace <命名空间> 指定K8s命名空间 (默认: unm-server)
    -p, --port <端口>        指定端口 (默认: 5678)

示例:
    $0 deploy docker -v v1.0.4 -e production
    $0 deploy compose -v latest
    $0 deploy k8s -v v1.0.4 -n unm-server
    $0 stop compose
    $0 build -v v1.0.4

EOF
}

# 主函数
main() {
    # 解析参数
    local command=""
    local deployment_type=""
    local version="$DEFAULT_VERSION"
    local env="$DEFAULT_ENV"
    local namespace="$DEFAULT_NAMESPACE"
    local port="5678"
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            deploy|stop|build|help)
                command="$1"
                shift
                ;;
            docker|compose|k8s|kubernetes)
                deployment_type="$1"
                shift
                ;;
            -v|--version)
                version="$2"
                shift 2
                ;;
            -e|--env)
                env="$2"
                shift 2
                ;;
            -n|--namespace)
                namespace="$2"
                shift 2
                ;;
            -p|--port)
                port="$2"
                shift 2
                ;;
            *)
                log_error "未知参数: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    # 检查命令
    if [ -z "$command" ]; then
        show_help
        exit 1
    fi
    
    # 处理命令
    case $command in
        help)
            show_help
            exit 0
            ;;
        build)
            build_docker_image "$version"
            exit 0
            ;;
        deploy|stop)
            if [ -z "$deployment_type" ]; then
                log_error "请指定部署类型"
                show_help
                exit 1
            fi
            ;;
    esac
    
    # 检查依赖
    check_dependencies "$deployment_type"
    
    # 执行命令
    case $command in
        deploy)
            case $deployment_type in
                docker)
                    deploy_docker "$version" "$env" "$port"
                    ;;
                compose)
                    deploy_compose "$version" "$env"
                    ;;
                k8s|kubernetes)
                    deploy_kubernetes "$version" "$namespace" "$env"
                    ;;
            esac
            ;;
        stop)
            stop_deployment "$deployment_type" "$namespace"
            ;;
    esac
}

# 运行主函数
main "$@"
