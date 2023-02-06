# 说明

这是一个基于 electron 的json格式化工具，下载地址：https://docs.r-xnoro.com/jsonbox

吐个槽，electron 的体积是真大啊

# 功能/计划

- [x] 粘贴即格式化（偶尔会不灵敏，就点下“parse”:cry:）

- [x] 代码着色（感谢“化名三爷”的[json着色](https://blog.csdn.net/zlxls/article/details/83185627)）

- [x] ctrl + f 搜索

- [x] 搜索定位

- [x] 搜索上一个、下一个 

- [x] 行号

- [x] 多tab页功能，同时操作多个json

- [x] F2 修改tab标签title

- [x] ctrl + s 保存文件

- [ ] 复制为xml

- [x] 复制为yaml

- [x] 设置-保存会话

- [x] 设置-快捷键说明

- [ ] 压缩 json

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
# win环境下打包
npm run build-dist:win
```

# 截图

![image-20230204151508674](https://imgbd.r-xnoro.com//image-20230204151508674.png)

![image-20230204151829103](https://imgbd.r-xnoro.com//image-20230204151829103.png)

![image-20230204151800184](https://imgbd.r-xnoro.com//image-20230204151800184.png)

![image-20230204152659117](https://imgbd.r-xnoro.com//image-20230204152659117.png)