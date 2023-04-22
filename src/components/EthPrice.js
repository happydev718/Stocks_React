var data=[] ;

async function add(){
try {
    const response = await  fetch('https://api.tvmaze.com/search/shows?q=all#')
    const json = await response.json()
    for (var i=0; i< json.length; i++){
        data.push(json[i])
    }
    return data
}catch(error){
    console.log("error", error)
}    
}


export default add;
