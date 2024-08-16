import './style.css'
import { JSONParser } from '@streamparser/json';

let loadedJSON = {}
let displayJSON = {}
let downloadJSON = {}

let fileName = ''

let loadingMessage = document.querySelector('#loading')
loadingMessage.style.display = 'none'

function uploadJSONFile(e) {
    loadingMessage.style.display = 'block'
    const input = e.target
    let file = input.files[0];

    let reader = new FileReader();

    reader.readAsText(file);

    reader.onload = function() {
        fileName = input.files[0].name
        document.querySelector('#fileName').innerHTML = fileName
        let keys = []

        loadedJSON = { dic: {}, stringDic: {}}

        const parser = new JSONParser();
        parser.onValue = ({ key, value }) => {
            if(value && (value.hasOwnProperty('messageEN') || value.hasOwnProperty('stringEN'))) {
                const upperKey = value.hasOwnProperty('messageEN') ? 'dic' : 'stringDic'
                let lowerKey = key
                if(keys.includes(key)){
                    const number = keys.filter((savedKey) => savedKey === key).length + 1
                    lowerKey += `__${number}`
                }
                keys.push(key)
                
                loadedJSON[upperKey][lowerKey] = value
            }
        };
        
        // Or passing the stream in several chunks 
        try {
            parser.write(reader.result.replaceAll('\\\\', '\\'));
        } catch (err) {
            console.log(err); // handler errors 
            loadingMessage.style.display = 'none'
        }

        console.log("JSON:")
        console.log(loadedJSON)

        console.log(1)
        downloadJSON = JSON.parse(JSON.stringify(loadedJSON))
        console.log(2)
        displayJSON = JSONtoDisplay(loadedJSON)
        console.log(3)
        renderJSON(displayJSON)
        console.log(4)
        
        loadingMessage.style.display = 'none'
        console.log(5)
    };

    reader.onerror = function() {
        console.log(reader.error);
        loadingMessage.style.display = 'none'
    };
}

function JSONtoDisplay(data) {
    let dic = {}
    let stringDic = {}
    for(let key in data.dic){
      const chrName = data.dic[key].chrName
      const messageEN = data.dic[key].messageEN
      const messageJP = data.dic[key].messageJP
      Object.assign(dic, { [key]: {chrName, messageEN, messageJP} })
    }
  
    for(let key in data.stringDic){
        const stringEN = data.stringDic[key].stringEN
        const stringJP = data.stringDic[key].stringJP
      Object.assign(stringDic, { [key]: {stringEN, stringJP} })
    }
  
    return {...data, dic, stringDic}
}

function renderJSON(json, filter){
    const displayWrapper = document.querySelector('#display-wrapper')
    displayWrapper.innerHTML = `
    <div class="line header">
        <div>ID</div>
        <div style='text-align:right;'>Personaje</div>
        <div style='min-width: calc(10px* 35);'>Español</div>
        <div style='min-width: calc(10px* 35);'>Original</div>
    </div>`

    let finalHTML = ''
    const totalKeys = Object.keys(json.dic).length + Object.keys(json.stringDic).length
    let keyCounter = 0
    for(const id in json.dic){
        keyCounter++
        updatePercent(totalKeys, keyCounter, 0.98)
        finalHTML += `
            <div class='line dic'>
                <div class='id'>
                    ${id}
                </div>
                <div class='char'>
                    <div><img src='portraits/FACE_${json.dic[id].chrName}.png' onerror="this.style.display='none'" /></div>
                    <div>${json.dic[id].chrName}</div>
                </div>
                <div class="text-area-wrapper">
                    <textarea class="ES-text" id='${id}' data-type='dic' wrap='off'>${json.dic[id].messageEN.replaceAll('\\n', '\n')}</textarea>
                </div>
                <textarea disabled wrap='off'>${json.dic[id].messageJP.replaceAll('\\n', '\n')}</textarea>
            </div>
        `
    }

    finalHTML += '<h4 class="mensajes">Mensajes</h4>'
    for(const id in json.stringDic){
        keyCounter++
        updatePercent(totalKeys, keyCounter, 0.98)
        finalHTML += `
            <div class='line stringDic'>
                <div class='id'>
                    ${id}
                </div>
                <div></div>
                <div class="text-area-wrapper">
                    <textarea class="ES-text" id='${id}' data-type='stringDic' class='${json.stringDic[id].stringEN.length > 30 ? 'warning' : ''}' wrap='off'>${json.stringDic[id].stringEN.replaceAll('\\n', '\n')}</textarea>
                </div>
                <textarea disabled wrap='off'>${json.stringDic[id].stringJP.replaceAll('\\n', '\n')}</textarea>
            </div>
        `
    }
    displayWrapper.innerHTML += finalHTML
    
    const allTextAreas = document.querySelectorAll('.ES-text')
    for(const textarea of allTextAreas) {
        textarea.style.height = "15px";
        textarea.style.height = (textarea.scrollHeight + 15) + "px";

        textarea.addEventListener('input', (e) => changeText(e, textarea.dataset.type))

    }
    
    if(chiaro){
        document.querySelector('#display-wrapper').classList.add('chiaro')
    } else {
        document.querySelector('#display-wrapper').classList.remove('chiaro')
    }

}

function changeText(e, prop) {
    const newText = e.target.value.replaceAll('\n', '\\n').replaceAll('\\', '\\\\')
    const id = e.target.id
    downloadJSON[prop][id].messageEN = newText
    e.target.style.height = "15px";
    e.target.style.height = (e.target.scrollHeight + 15) + "px";
    if(prop === 'stringDic') {
        if(newText.length > 30){
            e.target.classList.add('warning')
        } else {
            e.target.classList.remove('warning')
        }
    }
}

function downloadTheJSON() {
    var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(downloadJSON).replace(/\_\_\d+/g, ''));
    var downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href",     dataStr);
    downloadAnchorNode.setAttribute("download", fileName);
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

function reemplazar(term1, term2) {
    
}

function updatePercent(total, partial, factor = 1){
    const finalPercent = ((partial * 100) / total) * factor
    console.log(finalPercent)
    document.querySelector('#percent').innerHTML = finalPercent
}

document.querySelector('#file').addEventListener('change', uploadJSONFile)
document.querySelector('#download').addEventListener('click', downloadTheJSON)

function changeTheme() {
    document.querySelector('body').classList.toggle('dark')
}

document.querySelector('#darkTheme').addEventListener('click', changeTheme)

let chiaro = false

function changeFont() {
    chiaro = !chiaro
    document.querySelector('#display-wrapper').classList.toggle('chiaro')
}

document.querySelector('#font').addEventListener('click', changeFont)

