function showError(error){
    
    
    let errorField = document.getElementById("errorField")
    errorField.innerHTML = ""
    let detail = document.createElement('div')
    detail.setAttribute('id', 'error')
    detail.innerHTML += "<br>" + error
    errorField.appendChild(detail)

}

function getCookie(cname) {
    let name = cname + "=";
    let ca = document.cookie.split(';');
    for(let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) == ' ') {
        c = c.substring(1);
      }
      if (c.indexOf(name) == 0) {
        
        return decodeURIComponent(c.substring(name.length, c.length));
        
      }
    }
    return "";
  }