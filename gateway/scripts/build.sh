#!/bin/bash

# Music API Proxy 构建脚本
# 用途：构建生产环境可执行文件

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 项目信息
PROJECT_NAME="music-api-proxy"
BUILD_DIR="bin"
MAIN_PATH="./cmd/music-api-proxy"

# 版本信息
VERSION=${VERSION:-$(git describe --tags --always --dirty 2>/dev/null || echo "unknown")}
BUILD_TIME=$(date -u '+%Y-%m-%d_%H:%M:%S')
GIT_COMMIT=${GIT_COMMIT:-$(git rev-parse HEAD 2>/dev/null || echo "unknown")}

# 构建标志
LDFLAGS="-X main.Version=${VERSION} -X main.BuildTime=${BUILD_TIME} -X main.GitCommit=${GIT_COMMIT} -w -s"

# 生产环境构建配置
BUILD_TAGS="production"
CGO_ENABLED=0

# 支持的平台列表
PLATFORMS=(
    "linux/amd64"
    "linux/arm64"
    "windows/amd64"
    "windows/arm64"
    "darwin/amd64"
    "darwin/arm64"
)

# 当前平台配置
CURRENT_GOOS=${GOOS:-$(go env GOOS)}
CURRENT_GOARCH=${GOARCH:-$(go env GOARCH)}

# 默认构建所有平台（生产环境要求）
BUILD_ALL=${BUILD_ALL:-true}

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

# 检查Go环境
check_go() {
    if ! command -v go &> /dev/null; then
        log_error "Go未安装或不在PATH中"
        exit 1
    fi
    
    GO_VERSION=$(go version | awk '{print $3}')
    log_info "使用Go版本: ${GO_VERSION}"
}

# 检查项目结构
check_project() {
    if [ ! -f "go.mod" ]; then
        log_error "未找到go.mod文件，请确保在项目根目录执行"
        exit 1
    fi
    
    if [ ! -d "${MAIN_PATH}" ]; then
        log_error "未找到主程序目录: ${MAIN_PATH}"
        exit 1
    fi
    
    log_info "项目结构检查通过"
}

# 清理构建目录
clean_build() {
    if [ -d "${BUILD_DIR}" ]; then
        log_info "清理构建目录: ${BUILD_DIR}"
        rm -rf "${BUILD_DIR}"
    fi
    mkdir -p "${BUILD_DIR}"
}

# 下载依赖
download_deps() {
    log_info "下载Go模块依赖..."
    go mod download
    go mod tidy
    log_success "依赖下载完成"
}

# 验证构建
verify_build() {
    if [ "${SKIP_VERIFY}" != "true" ]; then
        log_info "验证构建..."
        go build -o /dev/null ./cmd/music-api-proxy
        log_success "构建验证通过"
    else
        log_warning "跳过构建验证"
    fi
}

# 代码检查
run_lint() {
    if [ "${SKIP_LINT}" != "true" ]; then
        if command -v golangci-lint &> /dev/null; then
            log_info "运行代码检查..."
            golangci-lint run
            log_success "代码检查通过"
        else
            log_warning "golangci-lint未安装，跳过代码检查"
        fi
    else
        log_warning "跳过代码检查"
    fi
}

# 构建二进制文件
build_binary() {
    local os=${1:-$(go env GOOS)}
    local arch=${2:-$(go env GOARCH)}
    local output_name="${PROJECT_NAME}"
    
    if [ "${os}" = "windows" ]; then
        output_name="${output_name}.exe"
    fi
    
    local output_path="${BUILD_DIR}/${output_name}"
    if [ "${os}" != "$(go env GOOS)" ] || [ "${arch}" != "$(go env GOARCH)" ]; then
        output_path="${BUILD_DIR}/${PROJECT_NAME}_${os}_${arch}"
        if [ "${os}" = "windows" ]; then
            output_path="${output_path}.exe"
        fi
    fi
    
    log_info "构建 ${os}/${arch} 版本..."
    log_info "输出文件: ${output_path}"
    log_info "版本信息: ${VERSION}"
    log_info "构建时间: ${BUILD_TIME}"
    log_info "Git提交: ${GIT_COMMIT}"
    
    CGO_ENABLED=${CGO_ENABLED} GOOS=${os} GOARCH=${arch} go build -tags "${BUILD_TAGS}" -ldflags "${LDFLAGS}" -o "${output_path}" "${MAIN_PATH}"
    
    if [ -f "${output_path}" ]; then
        local file_size=$(du -h "${output_path}" | cut -f1)
        log_success "构建完成: ${output_path} (${file_size})"
    else
        log_error "构建失败: ${output_path}"
        exit 1
    fi
}

# 构建多平台版本
build_multi_platform() {
    log_info "构建多平台版本..."

    # 遍历所有支持的平台
    for platform in "${PLATFORMS[@]}"; do
        local os=$(echo $platform | cut -d'/' -f1)
        local arch=$(echo $platform | cut -d'/' -f2)
        build_binary "$os" "$arch"
    done

    log_success "多平台构建完成"
}

# 计算文件SHA256
calculate_sha256() {
    local file="$1"
    if command -v sha256sum &> /dev/null; then
        sha256sum "$file" | awk '{print $1}'
    elif command -v shasum &> /dev/null; then
        shasum -a 256 "$file" | awk '{print $1}'
    else
        echo "unavailable"
    fi
}

# 生成构建信息
generate_build_info() {
    local info_file="${BUILD_DIR}/build-info.txt"
    log_info "生成构建信息: ${info_file}"

    cat > "${info_file}" << EOF
Music API Proxy 构建信息
========================

项目名称: ${PROJECT_NAME}
版本号: ${VERSION}
构建时间: ${BUILD_TIME}
Git提交: ${GIT_COMMIT}
Go版本: $(go version)
构建平台: $(go env GOOS)/$(go env GOARCH)

构建文件详情:
EOF

    # 添加每个二进制文件的详细信息
    for file in "${BUILD_DIR}"/*; do
        if [ -f "$file" ] && [ "$file" != "$info_file" ]; then
            local filename=$(basename "$file")
            local filesize=$(du -h "$file" | cut -f1)
            local sha256=$(calculate_sha256 "$file")

            cat >> "${info_file}" << EOF

文件: ${filename}
大小: ${filesize}
SHA256: ${sha256}
EOF
        fi
    done

    cat >> "${info_file}" << EOF

验证方法:
--------
Linux/macOS: sha256sum <文件名>
Windows: certutil -hashfile <文件名> SHA256
EOF

    log_success "构建信息已生成"
}

# 主函数
main() {
    log_info "开始构建Music API Proxy..."
    
    # 检查环境
    check_go
    check_project
    
    # 清理和准备
    clean_build
    download_deps
    
    # 代码质量检查
    run_lint
    verify_build
    
    # 构建
    if [ "${BUILD_ALL}" = "true" ]; then
        build_multi_platform
    else
        build_binary
    fi
    
    # 生成构建信息
    generate_build_info
    
    log_success "构建完成！"
    log_info "构建文件位于: ${BUILD_DIR}/"
}

# 显示帮助信息
show_help() {
    cat << EOF
Music API Proxy 构建脚本

用法: $0 [选项]

选项:
    -h, --help          显示帮助信息
    -a, --all           构建所有平台版本
    --skip-verify       跳过构建验证
    --skip-lint         跳过代码检查
    --version VERSION   指定版本号

环境变量:
    VERSION             版本号 (默认: git describe)
    GIT_COMMIT          Git提交哈希 (默认: git rev-parse HEAD)
    BUILD_ALL           构建所有平台 (true/false)
    SKIP_VERIFY         跳过构建验证 (true/false)
    SKIP_LINT           跳过代码检查 (true/false)

示例:
    $0                  # 构建当前平台版本
    $0 -a               # 构建所有平台版本
    $0 --skip-verify    # 跳过构建验证
    VERSION=v1.0.0 $0   # 指定版本号构建

EOF
}

# 解析命令行参数
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -a|--all)
            BUILD_ALL=true
            shift
            ;;
        --skip-verify)
            SKIP_VERIFY=true
            shift
            ;;
        --skip-lint)
            SKIP_LINT=true
            shift
            ;;
        --version)
            VERSION="$2"
            shift 2
            ;;
        *)
            log_error "未知选项: $1"
            show_help
            exit 1
            ;;
    esac
done

# 执行主函数
main
