# The Silver Case / The 25th Ward Chapter Text Editor
 
 This NodeJS / Vite application allows to load a Silver Case script/message JSON, modify and download it.

 It reads the `dic` and `stringDic` properties in the JSON, parses their keys and reads the messageEN and messageJP properties to display them and be able to modify them.

## Run the app

### Docker

If you have docker, you can get the app running by using

```
docker compose up
```

### npm / node

 You must open the project folder with a shell/terminal opened in the main directory, execute the following commands:

 ```
 npm install
 ```

 ```
 npm run dev
 ``` 
 to run a local server. [http://localhost:5173/](http://localhost:5173/)

 ```
 npm run build
 ``` 
 to build a production ready application.
