import './style.css'
import { JSONParser } from '@streamparser/json';

let params = new URLSearchParams(document.location.search);
let game = params.get("game"); // is the string "Jonathan"


let dic = 'dic'

let loadedJSON = {}
let ogLoadedJSON = {}
let displayJSON = {}
let ogDisplayJSON = {}
let downloadJSON = {}

let fileName = ''

if (game === 't25w') {
    toggleMode(false)
}

let loadingMessage = document.querySelector('#loading')
loadingMessage.style.display = 'none'


async function uploadJSONFile(e) {
    loadingMessage.style.display = 'block'
    const input = e.target
    let file = input.files[0];
    fileName = input.files[0].name



    const englishJSON = await fetch(`original_texts/${fileName}`)

    let ogFile = await englishJSON.text()






    let reader = new FileReader();
    reader.readAsText(file);

    reader.onload = function () {
        document.querySelector('#fileName').innerHTML = fileName

        let theJson = reader.result
        if (dic === 'dic') {
            theJson = theJson.replaceAll('\\\\', '\\')
        }

        loadedJSON = parseStuff(theJson)
        ogLoadedJSON = parseStuff(ogFile)

        console.log("JSON:")
        console.log(loadedJSON)
        console.log(ogLoadedJSON)

        downloadJSON = JSON.parse(JSON.stringify(loadedJSON))
        displayJSON = JSONtoDisplay(loadedJSON, true)
        ogDisplayJSON = JSONtoDisplay(ogLoadedJSON)

        setupFilters()
        renderJSON(displayJSON, ogDisplayJSON)

        loadingMessage.style.display = 'none'
    };

    reader.onerror = function () {
        console.log(reader.error);
        loadingMessage.style.display = 'none'
    };
}

function parseStuff(stuff) {
    let keys = []
    const theJSON = { [dic]: {}, stringDic: {} }
    const parser = new JSONParser();
    parser.onValue = ({ key, value }) => {
        if (value && (value.hasOwnProperty('messageEN') || value.hasOwnProperty('stringEN'))) {
            const upperKey = value.hasOwnProperty('messageEN') ? dic : 'stringDic'
            let lowerKey = key
            if (keys.includes(key)) {
                const number = keys.filter((savedKey) => savedKey === key).length + 1
                lowerKey += `__${number}`
            }
            keys.push(key)

            theJSON[upperKey][lowerKey] = value
        }
    };

    // Or passing the stream in several chunks 
    try {
        parser.write(stuff);
        return theJSON
    } catch (err) {
        console.log(err); // handler errors 
        loadingMessage.style.display = 'none'
    }
}

const scenesListIds = []
const scenesList = []
const charsList = []

function JSONtoDisplay(data, bakeFilters = false) {
    let _dic = {}
    let stringDic = {}
    for (let key in data[dic]) {
        const chrName = data[dic][key].chrName
        const messageEN = data[dic][key].messageEN
        const messageJP = data[dic][key].messageJP

        if (bakeFilters) {
            const sceneInfo = getScene(key)

            if (!charsList.includes(chrName))
                charsList.push(chrName)

            if (!scenesListIds.includes(sceneInfo.id)) {
                scenesListIds.push(sceneInfo.id)
                sceneInfo.chars.push(chrName)
                scenesList.push(sceneInfo)
            } else {
                const scene = scenesList.find((sc) => sc.id === sceneInfo.id)
                if (!scene.chars.includes(chrName)) {
                    scene.chars.push(chrName)
                }
            }

            const scene = scenesList.find((sc) => sc.id === sceneInfo.id)
            Object.assign(_dic, { [key]: { chrName, messageEN, messageJP, scene: scene } })
        } else
            Object.assign(_dic, { [key]: { chrName, messageEN, messageJP } })
    }

    for (let key in data.stringDic) {
        const stringEN = data.stringDic[key].stringEN
        const stringJP = data.stringDic[key].stringJP
        Object.assign(stringDic, { [key]: { stringEN, stringJP } })
    }

    return { ...data, _dic, stringDic }
}


function getScene(key) {
    const regex = /_+/;
    const splittedKey = key.split(regex)
    let sceneInfo = { type: '', id: null, chars: [] }
    switch (splittedKey[0]) {
        case 'SRF':
            sceneInfo.type = 'Dialogo'
            sceneInfo.id = splittedKey[splittedKey.length - 2]
            break;
        case 'CHAT':
        case 'BBS':
            sceneInfo.type = 'Chat'
            sceneInfo.id = splittedKey[1]
            break;
        case 'MAIL':
        case 'SMAIL':
            sceneInfo.type = 'Mail'
            sceneInfo.id = splittedKey[1]
            break;
        case 'MSG':
            sceneInfo.type = 'Texto'
            sceneInfo.id = splittedKey[1]
            break;
        default:
            sceneInfo.type = 'Otro'
            sceneInfo.id = key
            break;
    }
    return sceneInfo
}

function setupFilters() {

    //Characters
    $('#character-select').append('<option value="0" data-img="https://placehold.co/20x20?text=Todos">Todos</option>');
    for (let chrName of charsList) {
        let faceDir = dic === 'dic' ? `/FACE_${chrName}.png` : `/25/${chrName}.png`
        $('#character-select').append(`<option value="${chrName}" data-img="portraits${faceDir}">${chrName}</option>`);
    }
    $('#character-select').trigger('change');

    //Scenes
    const scenesTypes = []

    for (let scene of scenesList) {
        if (!scenesTypes.includes(scene.type))
            scenesTypes.push(scene.type)
    }
    scenesTypes.sort()
    for (let sceneType of scenesTypes) {
        $('#scenes-select').append(`<optgroup label="${sceneType}" id="${sceneType}_group">`);
    }

    for (let scene of scenesList) {
        $(`#${scene.type}_group`).append(`<option value="${scene.id}" data-img="https://placehold.co/20x20?text=${scene.type[0]}" >${scene.id}</option>`);
    }
    $('#scenes-select').trigger('change');

}

function renderJSON(translatedJSON, originalJSON, filter = false) {
    let json = translatedJSON
    let ogJson = originalJSON

    const displayWrapper = document.querySelector('#display-wrapper')
    displayWrapper.innerHTML = `
    <div class="line header">
        <div style='text-align:right;'>ID y Personaje</div>
        <div style='min-width: calc(10px* 35);'>Español</div>
        <div style='min-width: calc(10px* 35);'>Inglés</div>
        <div style='min-width: calc(10px* 35);'>Original</div>
    </div>`

    let finalHTML = ''
    const totalKeys = Object.keys(json[dic]).length + Object.keys(json.stringDic).length
    let keyCounter = 0

    let lastSceneId = -1
    for (const id in json[dic]) {
        keyCounter++
        updatePercent(totalKeys, keyCounter, 0.98)
        let filterIn = true

        if (filter) {
            let scene = true
            let character = true

            if (filters.scene !== '0')
                scene = json._dic[id].scene.id === filters.scene

            if (filters.character !== '0')
                character = json._dic[id].scene.chars.includes(filters.character)

            filterIn = scene && character
        }

        if (filterIn) {
            const isName = !!json[dic][id].chrName
            let faceDir = dic === 'dic' ? `/FACE_${json[dic][id].chrName}.png` : `/25/${json[dic][id].chrName}.png`
            let sceneId = getScene(id).id
            const isFirstLineOfScene = sceneId !== lastSceneId
            finalHTML += `
            <div class='line ${dic} ${isFirstLineOfScene ? 'upper-divisor' : ''}'>
                <div class='char'>
                    <div>
                      <img src='portraits${faceDir}' onerror="this.style.display='none'; this.classList.add('show-default-name-box')" />
                      <span style="${!isName ? 'display: none' : ''}">${json[dic][id].chrName.replace(/\bONNA\b/, 'MUJER').replace(/\bOTOKO\b/, 'HOMBRE')}<span>
                    </div>
                    <div>${json[dic][id].chrName}</div>
                    <div class="lineId"> ${id} </div>
                </div>
                <div class="text-area-wrapper">
                    <textarea class="ES-text" id='${id}' data-type='${dic}' wrap='off'>${json[dic][id].messageEN.replaceAll('\\n', '\n')}</textarea>
                </div>
                <div class="text-area-wrapper">
                    <textarea class="ES-text" id='EN_${id}' disabled data-type='${dic}' wrap='off'>${ogJson[dic][id] ? ogJson[dic][id].messageEN.replaceAll('\\n', '\n') : 'NOT FOUND'}</textarea>
                </div>
                <textarea disabled wrap='off'>${json[dic][id].messageJP.replaceAll('\\n', '\n')}</textarea>
            </div>
        `
        }

        lastSceneId = getScene(id).id
    }

    finalHTML += '<h4 class="mensajes">Mensajes</h4>'
    for (const id in json.stringDic) {
        keyCounter++
        updatePercent(totalKeys, keyCounter, 0.98)
        finalHTML += `
            <div class='line stringDic'>
                <div class='id'>
                    ${id}
                </div>
                <div class="text-area-wrapper">
                    <textarea class="ES-text" id='${id}' data-type='stringDic' class='${json.stringDic[id].stringEN.length > 30 ? 'warning' : ''}' wrap='off'>${json.stringDic[id].stringEN.replaceAll('\\n', '\n')}</textarea>
                </div>
                <div class="text-area-wrapper">
                    <textarea class="ES-text" id='${id}' data-type='stringDic' class='${ogJson.stringDic[id].stringEN.length > 30 ? 'warning' : ''}' wrap='off'>${ogJson.stringDic[id].stringEN.replaceAll('\\n', '\n')}</textarea>
                </div>
                <textarea disabled wrap='off'>${json.stringDic[id].stringJP.replaceAll('\\n', '\n')}</textarea>
            </div>
        `
    }
    displayWrapper.innerHTML += finalHTML

    const allTextAreas = document.querySelectorAll('.ES-text')
    for (const textarea of allTextAreas) {
        textarea.style.height = "15px";
        textarea.style.height = (textarea.scrollHeight + 15) + "px";

        textarea.addEventListener('input', (e) => changeText(e, textarea.dataset.type))

    }

    if (chiaro) {
        document.querySelector('#display-wrapper').classList.add('chiaro')
    } else {
        document.querySelector('#display-wrapper').classList.remove('chiaro')
    }

}

function changeText(e, prop) {
    const newText = e.target.value.replaceAll('\n', '\\n')
    const id = e.target.id
    if (prop === dic)
        downloadJSON[prop][id].messageEN = newText
    else
        downloadJSON[prop][id].stringEN = newText
    e.target.style.height = "15px";
    e.target.style.height = (e.target.scrollHeight + 15) + "px";
    if (prop === 'stringDic') {
        if (newText.length > 30) {
            e.target.classList.add('warning')
        } else {
            e.target.classList.remove('warning')
        }
    }
}

function downloadTheJSON() {
    var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(downloadJSON).replaceAll('\\', '\\\\').replace(/\_\_\d+/g, ''));
    var downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", fileName);
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

function reemplazar(term1, term2) {

}

function updatePercent(total, partial, factor = 1) {
    const finalPercent = ((partial * 100) / total) * factor
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

function toggleMode() {
    if (dic === 'dic') {
        dic = 'MessageDic'
        document.querySelector('#gameMode').classList.remove('tsc')
        document.querySelector('#gameMode').classList.add('t25w')

        document.querySelector('#T25WTag').style.display = "inline"
        document.querySelector('#TSCTag').style.display = "none"
    } else if (dic === 'MessageDic') {
        dic = 'dic'
        document.querySelector('#gameMode').classList.remove('t25w')
        document.querySelector('#gameMode').classList.add('tsc')

        document.querySelector('#TSCTag').style.display = "inline"
        document.querySelector('#T25WTag').style.display = "none"
    }
    document.querySelector('#display-wrapper').innerHTML = ""
    loadedJSON = {}
    ogLoadedJSON = {}
    displayJSON = {}
    ogDisplayJSON = {}
    downloadJSON = {}
    fileName = ''

    document.querySelector('#fileName').innerHTML = ""
}

function handleChangeMode() {
    if (Object.keys(downloadJSON).length !== 0 && downloadJSON.constructor === Object) {
        if (confirm("Tienes cambios sin guardar.\n¿Quieres Guardar y cambiar de modo?") === true) {
            downloadTheJSON()
            toggleMode()
        }
    } else {
        toggleMode()
    }
}

document.querySelector('#gameMode').addEventListener('click', handleChangeMode)


//Select2
function formatOption(option) {
    if (!option.id) {
        return option.text;
    }
    var imgSrc = $(option.element).data('img');
    return $(
        '<span><img src="' + imgSrc + '" style="width:20px;height:20px;margin-right:8px;vertical-align:middle;">' +
        option.text + '</span>'
    );
}


$('#character-select, #scenes-select').select2({
    templateResult: formatOption,
    templateSelection: formatOption,
    minimumResultsForSearch: Infinity // Oculta buscador
});

let filters = {}

$('#character-select').on('change', function () {
    let selectedValue = $(this).val();
    if (selectedValue !== 0)
        filters.character = selectedValue
    else
        filters.character = null
    renderJSON(displayJSON, ogDisplayJSON, true)
});
$('#scenes-select').on('change', function () {
    let selectedValue = $(this).val();
    if (selectedValue !== 0)
        filters.scene = selectedValue
    else
        filters.scene = null
    renderJSON(displayJSON, ogDisplayJSON, true)
});

function toggleFilters() {
    const filterSection = document.querySelector('#filter-section')
    filterSection.classList.toggle('hide')
    if (filterSection.classList.contains('hide'))
        document.querySelector('#filterToggle').innerHTML = 'Abrir Filtros'
    else
        document.querySelector('#filterToggle').innerHTML = 'Cerrar Filtros'
}

document.querySelector('#filterToggle').addEventListener('click', toggleFilters)
