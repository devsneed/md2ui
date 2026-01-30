# 发布到 npm 仓库

## 前置准备

1. 注册 npm 账号：https://www.npmjs.com/signup
2. 确认邮箱已验证

## 发布步骤

### 1. 登录 npm

```bash
npm login
```


按提示输入用户名、密码和邮箱。

### 2. 检查包名可用性

```bash
npm search md2ui
```

如果包名已被占用，有两个选择：

- 修改 package.json 中的 name 字段
- 使用 scope 方式：`@your-username/md2ui`

### 3. 发布

```bash
# 普通发布
npm publish

# 如果使用 scope，需要加 --access public
npm publish --access public
```

### 4. 更新版本

修改 package.json 中的 version 字段，或使用命令：

```bash
# 补丁版本 1.0.0 -> 1.0.1
npm version patch

# 次版本 1.0.0 -> 1.1.0
npm version minor

# 主版本 1.0.0 -> 2.0.0
npm version major
```

然后重新发布：

```bash
npm publish
```

## 用户安装使用

```bash
# 全局安装
npm install -g md2ui

# 在包含 .md 文件的目录下运行
cd /path/to/your/docs
md2ui

# 指定端口
md2ui -p 3000
```

## 常见问题

### 403 Forbidden

- 检查是否已登录：`npm whoami`
- 检查包名是否被占用
- 检查邮箱是否已验证

### 包名被占用

修改 package.json：

```json
{
  "name": "@your-username/md2ui"
}
```

发布时使用：

```bash
npm publish --access public
```

用户安装：

```bash
npm install -g @your-username/md2ui
```
