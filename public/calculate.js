function calculate(data){
    
    const wage = data.other.wage
    const tax = data.other.tax
    let brutto = 0

    for (let item of data.extras){

        const qty = item.quantity
        const multiplier = item.multiplier

        if (item.label == "hälytysraha"){
            brutto += qty * multiplier
            continue
        }
        
        
        const itemBrutto = qty * round2((wage * multiplier).toPrecision(5))
        
        brutto += round2(itemBrutto)    
    }
    
    
    brutto = round2(brutto)

    const taxes = round2(brutto * tax / 100)
    const tvak = round2(brutto * 0.014)
    const kuel = round2(brutto * 0.0715)
    const union = round2(round1(brutto) * 0.011)

    const netto = round2(brutto - taxes - tvak - kuel - union)

    const calculation = {  
                            "brutto": brutto, 
                            "netto": netto, 
                            "ennakonpidätys": taxes,  
                            "tvak-maksu": tvak, 
                            "eläkemaksu": kuel, 
                            "liitto": union, 
                        }
    
    console.log("Calculation done, valid file: " + data.other.wasValidFile)

    

    data["calculation"] = calculation

    console.log(data)

    return data
}



function round2(number){
    return Math.round(number * 100) / 100
}
function round1(number){
    return Math.round(number * 10) / 10
}