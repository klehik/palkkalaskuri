let loggedIn = false

function init (){

    // check if cookies have username stored
    let username = getCookie('username')
    
    // if user has logged in render user element to navbar
    if (username){
        loggedIn = true
        
        let log = document.getElementById("login")
        let parent = log.parentNode 
        parent.removeChild(log)
        let a = document.createElement('a')
        a.setAttribute('class', 'nav-right-links')
        a.setAttribute('id', 'login')

        let dropdownHtml = `<div class="dropdown">
                            <div class="dropbtn">
                                <img id="userIcon" class="icon" src="user.png"</img>
                                ${username} 
      
                            </div>
                            <div class="dropdown-content">
                                <a href="/settings">Asetukset</a>
                                <a href='/logout'>Kirjaudu ulos</a>
                                
                            </div>
                        </div> `
        a.innerHTML = dropdownHtml
        parent.appendChild(a)   
  }
    
    // get elements
    let file;
    let dropArea = document.getElementById("divToDrop")
    let button = document.getElementById("uploadButton")
    let input = document.getElementById("uploadFile")
   
    // browse button clicked
    button.onclick = ()=>{
        input.click(); 
        }
    
    // file browser
    input.addEventListener("change", function(event){
        event.preventDefault()
        file = input.files[0]
        if (validFileformat(file)){
            getUserInput(file)
        }
        
        
        });
    // drag & drop
    dropArea.addEventListener('drop', function(event){
        event.preventDefault()
        file = event.dataTransfer.files[0]
        if (validFileformat(file)){
            getUserInput(file)
        }
        
        
        })
    
}

function validFileformat(file){
    if (file.type != "application/pdf"){
        showError("Tiedoston tulee olla pdf-muodossa!")
        
        return false
    }
    return true
}


function allowDrop(event){
    event.preventDefault()   
}


const timeout = async ms => new Promise(res => setTimeout(res, ms))
let next = false // true after user input


async function waitUserInput() {
    
    while (next === false) await timeout(50) // pauses script until user input
    next = false; 
}

  
// get wage and tax info if user not logged in
async function getUserInput(file) {
    let wage;
    let tax;
    if (loggedIn){
        wage=getCookie('wage')
        tax=getCookie('tax')
    }else{
        wage = prompt("Anna tuntipalkkasi", "").replace(/,/g, '.')
        tax = prompt("Anna veroprosenttisi", "").replace(/,/g, '.')
    }

    wage = parseFloat(wage)
    tax = parseFloat(tax)
    
    // error handling for user input
    if (isNaN(wage)) {
        showError("Et syöttänyt tuntipalkkaa! Kokeile uudestaan")
        
        return
    } else if (isNaN(tax)) {
        showError("Et syöttänyt veroprosenttia! Kokeile uudestaan")
        return
    } else {
        next = true
    }

    await waitUserInput() // wait until user input
    
    
    post(file, wage, tax)
}




function post(file, wage, tax){

    // Create form data
    let formData = new FormData()
    formData.append('pdf', file)
    formData.append('name', file.name)
    formData.append('wage', wage)
    formData.append('tax', tax)

    // POST request to server, convert response to json, calculate and show results
    fetch('/', {
        method: 'POST',
        body: formData
        })
    .then(response => response.json())
    .then(json_data => {
        if (json_data.other.wasValidFile){
            let calc = calculate(json_data)
            showResults(calc)
        }else {
            showError("Tiedosto ei tainnut olla toteuma!")

        }})
    .catch(error => {
        console.error('Error:', error)
    }) 
    } 
    
    function showResults(json_data){
        
        let dropArea = document.getElementById("divToDrop")
        dropArea.classList.add("active")

        const netto = json_data.calculation.netto
        let count = 0

        // calculation animation
        function countUp(){
            if (count < netto && netto >100){
                count += (Math.floor(netto/100))
            }else {
                
                createElements()
                return
            }
            let randomDecimal = Math.floor(Math.random() * 99)
            dropArea.innerHTML = "Lasketaan.. <br>" + count + "." + randomDecimal + " €"
        }

        let counter = setInterval(() => {
            countUp()
        }, 5);

        function createElements(){
            clearInterval(counter)
            dropArea.innerHTML = ""

            // container
            let resultContainer = document.createElement('div')
            resultContainer.setAttribute('class', 'resultContainer')

             // header element
            let headerDiv = document.createElement('div')
            headerDiv.setAttribute('style', 'border-bottom: 1px solid white')
            headerDiv.innerHTML = "Sinulle maksetaan työaikalisiä <br>" + netto + " €<br>" 
            resultContainer.appendChild(headerDiv)

            dropArea.appendChild(resultContainer)

            
            
            
            // detail elements
            let detailsDiv = document.createElement('div')
            detailsDiv.setAttribute('class', 'details')

            

            // left detail element
            let leftTable = document.createElement('table')
            leftTable.setAttribute('id', 'leftTable')
            for (let key of Object.keys(json_data.calculation)){
               let tr = document.createElement('tr')
                let tdItem = document.createElement('td')
                let tdValue = document.createElement('td')

                tdItem.innerHTML = key
                tdValue.innerHTML = json_data.calculation[key] + " €"
                tr.appendChild(tdItem)
                tr.appendChild(tdValue)
                leftTable.appendChild(tr)
                detailsDiv.appendChild(leftTable)
            }
            // right detail element
            let rightTable = document.createElement('table')
            rightTable.setAttribute('id', 'rightTable')
            for (let item of json_data.extras){
                let tr = document.createElement('tr')
                let tdExtra = document.createElement('td')
                let tdHours = document.createElement('td')

                tdExtra.innerHTML = item.label
                if (item.label == "hälytysraha") tdHours.innerHTML = item.quantity + " kpl"
                else tdHours.innerHTML = item.quantity + " h"
                tr.appendChild(tdExtra)
                tr.appendChild(tdHours)
                rightTable.appendChild(tr)
                detailsDiv.appendChild(rightTable)
            }

            
            
            
            resultContainer.appendChild(detailsDiv)

            let d = document.createElement('div')
            d.setAttribute('style', 'font-size: 12px; padding: 20px')
            d.textContent = "Laskelma laskettiin " + json_data.other.wage + " € tuntipalkalla ja veroprosentti oli " + json_data.other.tax 
            dropArea.appendChild(d)
           

            // refresh icon
            let refreshIcon = document.createElement('img')
            refreshIcon.setAttribute('src', 'refresh-128.png')
            refreshIcon.setAttribute('class', 'icon')
            refreshIcon.addEventListener('click', function(){
                window.location.reload()
            })
            
            dropArea.appendChild(refreshIcon)

            

        }

        

        
     } 
