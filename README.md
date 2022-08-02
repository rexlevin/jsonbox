# 说明

这是一个基于electron的json格式化工具

吐个槽，electron的体积是真大啊，待tauri成熟了换成tauri，毕竟体积更小。

# 功能/计划

1. 粘贴即格式化（偶尔会不灵敏，就点下“parse”:cry:，待优化吧～）

2. 代码着色（感谢“化名三爷”的[json着色](https://blog.csdn.net/zlxls/article/details/83185627)）

3. ctrl + f 搜索

4. 搜索定位（待完成）

5. 搜索上一个、下一个（待完成） 

5. 行号（待完成）

# 开发

```bash
# github
git clone https://github.com/rexlevin/jsonbox.git
# gitee
git clone https://gitee.com/rexlevin/jsonbox.git

cd jsonbox
npm i

# 安装electron-builder
npm i -g electron-builder
# linux环境下打包
npm run build-dist:linux
```

# 截图

![image-20220730132959338](https://imgbd.r-xnoro.com//image-20220730132959338.png)