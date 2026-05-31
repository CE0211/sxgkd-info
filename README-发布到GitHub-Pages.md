# 发布到 GitHub Pages

这个文件夹就是公开网页发布包。你只需要把这里的 `index.html` 上传到 GitHub 的公开仓库，就能得到一个同学可访问的网址。

## 第一次发布

1. 打开 GitHub：<https://github.com/>
2. 登录或注册账号。
3. 右上角点 `+`，选择 `New repository`。
4. 仓库名建议写：`sxgkd-info`
5. 选择 `Public`。
6. 勾选 `Add a README file`，然后点 `Create repository`。
7. 进入仓库后点 `Add file` -> `Upload files`。
8. 把本文件夹里的 `index.html` 拖进去。
9. 点 `Commit changes`。
10. 进入 `Settings` -> `Pages`。
11. `Build and deployment` 里选择：
    - Source: `Deploy from a branch`
    - Branch: `main`
    - Folder: `/root`
12. 点 `Save`。

等 1-3 分钟后，页面会给你一个网址，通常长这样：

`https://你的用户名.github.io/sxgkd-info/`

## 后续更新

现在这个发布包先适合手动上传。等你把仓库建好后，把仓库网址发给我，我可以继续帮你把自动化改成：每次检索后同步更新这个公开网页。

## 公开内容边界

这个网页只适合发布学校官网公开可访问的信息：标题、时间、摘要、附件链接、原文链接。

不要公开需要学生账号登录后才能看到的内容，也不要上传账号、密码、Cookie、学号、手机号等个人信息。
