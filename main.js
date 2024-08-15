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
            parser.write(reader.result);
        } catch (err) {
            console.log(err); // handler errors 
            loadingMessage.style.display = 'none'
        }

        console.log("JSON:")
        console.log(loadedJSON)

        downloadJSON = JSON.parse(JSON.stringify(loadedJSON))
        displayJSON = JSONtoDisplay(loadedJSON)
        renderJSON(displayJSON)
        
        loadingMessage.style.display = 'none'
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
      const messageEN = data.dic[key].messageEN.replaceAll('\\\\', '\\')
      Object.assign(dic, { [key]: {chrName, messageEN} })
    }
  
    for(let key in data.stringDic){
      const stringEN= data.stringDic[key].stringEN
      Object.assign(stringDic, { [key]: {stringEN} })
    }
  
    return {...data, dic, stringDic}
}

function renderJSON(json, filter){
    const displayWrapper = document.querySelector('#display-wrapper')
    displayWrapper.innerHTML = '<div class="line floating-line"><div></div><div></div><div><div class="red-line"></div></div></div>'
    for(const id in json.dic){
        const div = `
            <div class='line'>
                <div class='id'>
                    ${id}
                </div>
                <div class='char'>
                    ${json.dic[id].chrName}
                </div>
                <textarea id='${id}' data-type='dic' wrap='off'>${json.dic[id].messageEN.replaceAll('\\n', '\n')}</textarea>
            </div>
        `
        displayWrapper.innerHTML += div

    }
    displayWrapper.innerHTML += '<h4 class="mensajes">Mensajes</h4>'
    for(const id in json.stringDic){
        const div = `
            <div class='line'>
                <div class='id'>
                    ${id}
                </div>
                <div></div>
                <textarea id='${id}' data-type='stringDic' class='${json.stringDic[id].stringEN.length > 30 ? 'warning' : ''}' wrap='off'>${json.stringDic[id].stringEN.replaceAll('\\n', '\n')}</textarea>
            </div>
        `
        displayWrapper.innerHTML += div
    }
    
    const allTextAreas = document.querySelectorAll('textarea')
    for(const textarea of allTextAreas) {
        textarea.style.height = "15px";
        textarea.style.height = (textarea.scrollHeight + 15) + "px";

        textarea.addEventListener('input', (e) => changeText(e, textarea.dataset.type))

    }
    
    if(chiaro){
        document.querySelector('#display-wrapper').classList.add('chiaro')
        document.querySelector('.red-line').classList.add('chiaro')
    } else {
        document.querySelector('#display-wrapper').classList.remove('chiaro')
        document.querySelector('.red-line').classList.remove('chiaro')
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
    document.querySelector('.red-line').classList.toggle('chiaro')
}

document.querySelector('#font').addEventListener('click', changeFont)

