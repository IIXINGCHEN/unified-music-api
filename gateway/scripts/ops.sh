#!/bin/bash

# Music API Proxy 运维工具脚本
# 提供日常运维操作的便捷工具

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

# 检查服务状态
check_status() {
    local deployment_type=${1:-"auto"}
    
    log_info "检查服务状态..."
    
    case $deployment_type in
        docker)
            check_docker_status
            ;;
        compose)
            check_compose_status
            ;;
        k8s|kubernetes)
            local namespace=${2:-$DEFAULT_NAMESPACE}
            check_k8s_status "$namespace"
            ;;
        auto)
            # 自动检测部署类型
            if kubectl get pods -n "$DEFAULT_NAMESPACE" &> /dev/null; then
                check_k8s_status "$DEFAULT_NAMESPACE"
            elif docker ps | grep -q unm-server; then
                check_docker_status
            elif docker-compose ps &> /dev/null || docker compose ps &> /dev/null; then
                check_compose_status
            else
                log_warning "未检测到运行中的Music API Proxy实例"
            fi
            ;;
    esac
}

# 检查Docker状态
check_docker_status() {
    log_info "检查Docker容器状态"
    
    if docker ps | grep -q unm-server; then
        log_success "Music API Proxy容器正在运行"
        docker ps --filter name=unm-server --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
        
        # 健康检查
        if curl -f http://localhost:5678/health > /dev/null 2>&1; then
            log_success "健康检查通过"
        else
            log_error "健康检查失败"
        fi
    else
        log_error "Music API Proxy容器未运行"
    fi
}

# 检查Docker Compose状态
check_compose_status() {
    log_info "检查Docker Compose服务状态"
    
    if command -v docker-compose &> /dev/null; then
        docker-compose ps
    else
        docker compose ps
    fi
    
    # 健康检查
    if curl -f http://localhost:5678/health > /dev/null 2>&1; then
        log_success "Music API Proxy健康检查通过"
    else
        log_error "Music API Proxy健康检查失败"
    fi
}

# 检查Kubernetes状态
check_k8s_status() {
    local namespace=${1:-$DEFAULT_NAMESPACE}
    
    log_info "检查Kubernetes部署状态 (命名空间: $namespace)"
    
    # 检查Pod状态
    kubectl get pods -n "$namespace" -l app=unm-server
    
    # 检查Service状态
    kubectl get services -n "$namespace"
    
    # 检查Deployment状态
    kubectl get deployments -n "$namespace"
    
    # 健康检查
    local pod_name=$(kubectl get pods -n "$namespace" -l app=unm-server -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)
    if [ -n "$pod_name" ]; then
        if kubectl exec -n "$namespace" "$pod_name" -- curl -f http://localhost:5678/health > /dev/null 2>&1; then
            log_success "健康检查通过"
        else
            log_error "健康检查失败"
        fi
    fi
}

# 查看日志
view_logs() {
    local deployment_type=${1:-"auto"}
    local lines=${2:-100}
    
    case $deployment_type in
        docker)
            log_info "查看Docker容器日志"
            docker logs --tail "$lines" -f unm-server
            ;;
        compose)
            log_info "查看Docker Compose服务日志"
            if command -v docker-compose &> /dev/null; then
                docker-compose logs --tail="$lines" -f unm-server
            else
                docker compose logs --tail="$lines" -f unm-server
            fi
            ;;
        k8s|kubernetes)
            local namespace=${3:-$DEFAULT_NAMESPACE}
            log_info "查看Kubernetes Pod日志 (命名空间: $namespace)"
            kubectl logs -f deployment/unm-server -n "$namespace" --tail="$lines"
            ;;
        auto)
            # 自动检测部署类型
            if kubectl get pods -n "$DEFAULT_NAMESPACE" &> /dev/null; then
                view_logs "k8s" "$lines" "$DEFAULT_NAMESPACE"
            elif docker ps | grep -q unm-server; then
                view_logs "docker" "$lines"
            else
                view_logs "compose" "$lines"
            fi
            ;;
    esac
}

# 重启服务
restart_service() {
    local deployment_type=${1:-"auto"}
    
    case $deployment_type in
        docker)
            log_info "重启Docker容器"
            docker restart unm-server
            ;;
        compose)
            log_info "重启Docker Compose服务"
            if command -v docker-compose &> /dev/null; then
                docker-compose restart unm-server
            else
                docker compose restart unm-server
            fi
            ;;
        k8s|kubernetes)
            local namespace=${2:-$DEFAULT_NAMESPACE}
            log_info "重启Kubernetes部署 (命名空间: $namespace)"
            kubectl rollout restart deployment/unm-server -n "$namespace"
            kubectl rollout status deployment/unm-server -n "$namespace"
            ;;
        auto)
            # 自动检测部署类型
            if kubectl get pods -n "$DEFAULT_NAMESPACE" &> /dev/null; then
                restart_service "k8s" "$DEFAULT_NAMESPACE"
            elif docker ps | grep -q unm-server; then
                restart_service "docker"
            else
                restart_service "compose"
            fi
            ;;
    esac
    
    log_success "服务重启完成"
}

# 扩缩容
scale_service() {
    local deployment_type=$1
    local replicas=$2
    local namespace=${3:-$DEFAULT_NAMESPACE}
    
    case $deployment_type in
        compose)
            log_info "扩缩容Docker Compose服务到 $replicas 个实例"
            if command -v docker-compose &> /dev/null; then
                docker-compose up -d --scale unm-server="$replicas"
            else
                docker compose up -d --scale unm-server="$replicas"
            fi
            ;;
        k8s|kubernetes)
            log_info "扩缩容Kubernetes部署到 $replicas 个副本 (命名空间: $namespace)"
            kubectl scale deployment/unm-server --replicas="$replicas" -n "$namespace"
            kubectl rollout status deployment/unm-server -n "$namespace"
            ;;
        *)
            log_error "不支持的部署类型: $deployment_type"
            exit 1
            ;;
    esac
    
    log_success "扩缩容完成"
}

# 备份数据
backup_data() {
    local backup_dir="backup/$(date +%Y%m%d_%H%M%S)"
    
    log_info "创建数据备份到: $backup_dir"
    
    mkdir -p "$backup_dir"
    
    # 备份配置文件
    if [ -d "config" ]; then
        cp -r config "$backup_dir/"
        log_info "配置文件已备份"
    fi
    
    # 备份日志文件
    if [ -d "logs" ]; then
        cp -r logs "$backup_dir/"
        log_info "日志文件已备份"
    fi
    
    # 备份数据文件
    if [ -d "data" ]; then
        cp -r data "$backup_dir/"
        log_info "数据文件已备份"
    fi
    
    # 创建备份信息文件
    cat > "$backup_dir/backup_info.txt" << EOF
备份时间: $(date)
备份类型: 数据备份
Git提交: $(git rev-parse --short HEAD 2>/dev/null || echo "未知")
Git分支: $(git branch --show-current 2>/dev/null || echo "未知")
EOF
    
    log_success "数据备份完成: $backup_dir"
}

# 清理日志
cleanup_logs() {
    local days=${1:-7}
    
    log_info "清理 $days 天前的日志文件"
    
    if [ -d "logs" ]; then
        find logs -name "*.log" -type f -mtime +$days -delete
        log_success "日志清理完成"
    else
        log_warning "日志目录不存在"
    fi
}

# 监控资源使用
monitor_resources() {
    local deployment_type=${1:-"auto"}
    local namespace=${2:-$DEFAULT_NAMESPACE}
    
    case $deployment_type in
        docker)
            log_info "监控Docker容器资源使用"
            docker stats unm-server --no-stream
            ;;
        compose)
            log_info "监控Docker Compose服务资源使用"
            docker stats $(docker-compose ps -q) --no-stream 2>/dev/null || \
            docker stats $(docker compose ps -q) --no-stream
            ;;
        k8s|kubernetes)
            log_info "监控Kubernetes Pod资源使用 (命名空间: $namespace)"
            kubectl top pods -n "$namespace" -l app=unm-server
            kubectl top nodes
            ;;
        auto)
            # 自动检测部署类型
            if kubectl get pods -n "$DEFAULT_NAMESPACE" &> /dev/null; then
                monitor_resources "k8s" "$DEFAULT_NAMESPACE"
            elif docker ps | grep -q unm-server; then
                monitor_resources "docker"
            else
                monitor_resources "compose"
            fi
            ;;
    esac
}

# 健康检查
health_check() {
    local endpoint=${1:-"http://localhost:5678"}
    
    log_info "执行健康检查: $endpoint"
    
    # 基本健康检查
    if curl -f "$endpoint/health" > /dev/null 2>&1; then
        log_success "基本健康检查通过"
    else
        log_error "基本健康检查失败"
        return 1
    fi
    
    # 详细健康检查
    local health_response=$(curl -s "$endpoint/health" 2>/dev/null)
    if [ -n "$health_response" ]; then
        echo "健康检查响应:"
        echo "$health_response" | jq . 2>/dev/null || echo "$health_response"
    fi
    
    # 系统信息检查
    local system_response=$(curl -s "$endpoint/api/v1/system/info" 2>/dev/null)
    if [ -n "$system_response" ]; then
        echo "系统信息:"
        echo "$system_response" | jq . 2>/dev/null || echo "$system_response"
    fi
}

# 性能测试
performance_test() {
    local endpoint=${1:-"http://localhost:5678"}
    local requests=${2:-100}
    local concurrency=${3:-10}
    
    log_info "执行性能测试: $requests 请求, $concurrency 并发"
    
    if command -v ab &> /dev/null; then
        ab -n "$requests" -c "$concurrency" "$endpoint/health"
    elif command -v wrk &> /dev/null; then
        wrk -t"$concurrency" -c"$concurrency" -d10s "$endpoint/health"
    else
        log_warning "未安装性能测试工具 (ab 或 wrk)"
        log_info "使用curl进行简单测试"
        
        local start_time=$(date +%s%N)
        for i in $(seq 1 10); do
            curl -s "$endpoint/health" > /dev/null
        done
        local end_time=$(date +%s%N)
        
        local duration=$((($end_time - $start_time) / 1000000))
        log_info "10次请求耗时: ${duration}ms"
    fi
}

# 显示帮助信息
show_help() {
    cat << EOF
Music API Proxy 运维工具

用法: $0 <命令> [选项]

命令:
    status          检查服务状态
    logs            查看日志
    restart         重启服务
    scale           扩缩容服务
    backup          备份数据
    cleanup         清理日志
    monitor         监控资源使用
    health          健康检查
    perf            性能测试
    help            显示帮助信息

选项:
    -t, --type <类型>        部署类型 (docker/compose/k8s/auto)
    -n, --namespace <命名空间> K8s命名空间 (默认: unm-server)
    -l, --lines <行数>       日志行数 (默认: 100)
    -r, --replicas <副本数>  扩缩容副本数
    -d, --days <天数>        清理日志天数 (默认: 7)
    -e, --endpoint <地址>    健康检查地址
    --requests <数量>        性能测试请求数 (默认: 100)
    --concurrency <并发>     性能测试并发数 (默认: 10)

示例:
    $0 status                           # 自动检测并检查状态
    $0 status -t k8s -n unm-server     # 检查K8s状态
    $0 logs -t docker -l 50            # 查看Docker日志
    $0 restart -t compose              # 重启Compose服务
    $0 scale -t k8s -r 5               # K8s扩容到5个副本
    $0 backup                          # 备份数据
    $0 cleanup -d 3                    # 清理3天前的日志
    $0 monitor -t auto                 # 监控资源使用
    $0 health -e http://localhost:5678 # 健康检查
    $0 perf --requests 200 --concurrency 20 # 性能测试

EOF
}

# 主函数
main() {
    # 解析参数
    local command=""
    local deployment_type="auto"
    local namespace="$DEFAULT_NAMESPACE"
    local lines=100
    local replicas=""
    local days=7
    local endpoint="http://localhost:5678"
    local requests=100
    local concurrency=10
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            status|logs|restart|scale|backup|cleanup|monitor|health|perf|help)
                command="$1"
                shift
                ;;
            -t|--type)
                deployment_type="$2"
                shift 2
                ;;
            -n|--namespace)
                namespace="$2"
                shift 2
                ;;
            -l|--lines)
                lines="$2"
                shift 2
                ;;
            -r|--replicas)
                replicas="$2"
                shift 2
                ;;
            -d|--days)
                days="$2"
                shift 2
                ;;
            -e|--endpoint)
                endpoint="$2"
                shift 2
                ;;
            --requests)
                requests="$2"
                shift 2
                ;;
            --concurrency)
                concurrency="$2"
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
    
    # 执行命令
    case $command in
        help)
            show_help
            ;;
        status)
            check_status "$deployment_type" "$namespace"
            ;;
        logs)
            view_logs "$deployment_type" "$lines" "$namespace"
            ;;
        restart)
            restart_service "$deployment_type" "$namespace"
            ;;
        scale)
            if [ -z "$replicas" ]; then
                log_error "请指定副本数 (-r 或 --replicas)"
                exit 1
            fi
            scale_service "$deployment_type" "$replicas" "$namespace"
            ;;
        backup)
            backup_data
            ;;
        cleanup)
            cleanup_logs "$days"
            ;;
        monitor)
            monitor_resources "$deployment_type" "$namespace"
            ;;
        health)
            health_check "$endpoint"
            ;;
        perf)
            performance_test "$endpoint" "$requests" "$concurrency"
            ;;
    esac
}

# 运行主函数
main "$@"
