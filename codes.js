const POST_SELLER = "http://gestor.dasorte.com/redepos/comum-vendedor/salvar";
let sellers = [];
let startCodeSeller = null;
let codeAvailable = null;
let idCollector = null;
function transformInJSON(data) {
    data = data.children;
    return {
        "codigo" : data[10].innerHTML,
        "id"   : data[1].innerHTML,
        "estado" : "PE",
        "id_supervisor": 866,
        "id_arrecadador": idCollector
    };
}

function resolveResponse(body) {
    let code = startCodeSeller;
    let rows = body.children[0].children;
    for (let index = 0; index < rows.length; index++) {
       if (code === codeAvailable) {
           code += 1;
       }
       const element = transformInJSON(rows[index]);
       if (code < 1000) {
          element.codigo = '0' + code;
       if (code >= 1000) {
          element.codigo = code;
       }        
       sellers.push(element);
       code++;
    }
    for (let index = 0; index < sellers.length; index++) {
        console.log('ok');
        if (code >= 1000) {
		persistSeller({
		    "codigo" : (900+index),
		    "id"   : sellers[index].id,
		    "estado" : "PE",
		    "id_supervisor": 866,
		    "id_arrecadador": idCollector,
		     "tipo": "0"		
		});
	}
        else {
		persistSeller({
		    "codigo" : (900+index),
		    "id"   : sellers[index].id,
		    "estado" : "PE",
		    "id_supervisor": 866,
		    "id_arrecadador": idCollector        
		});
	}
    }    
    console.log(sellers);
    let index = sellers.length - 1;
    while (index > -1) {
        persistSeller(sellers[index]);
        index--;    
    }
}

function persistSeller(body) {
    jQuery.ajax(POST_SELLER, {
        contentType : "application/x-www-form-urlencoded",
        method : "post",
        async: false,
        data: body,
        success: function() {
            console.info(body.id + " has send.");
        }
    });
}

function getUrl(collector) {
	let url = 'http://gestor.dasorte.com/redepos/comum-vendedor/dados?enderecos=1&id_modelo=270&secao=principal&parametros=id_arrecadador:arrecadador:Arrecadador:IGUAL:%id::%name::false:;&results=1000&sortCol=codigo&sortDir=ASC&startIndex=0&__seq=490241';
	let newurl = url.replace('%id', collector.id).replace('%name', collector.name);
	
	return newurl;
}

function getSellers(collector) {
	url = getUrl(collector); 
	jQuery.get(url, resolveResponse);
}

function main() {
	let collectors = [
        {id: 1281, name: '0100 - Mata Sul', code: 100},
		{id: 1337, name: '09 - Cabo 01', code: 200},
		{id: 1759, name: '14 - Cabo 02', code: 300},
		{id: 1662, name: '13 - Ponte dos Carvalhos 01', code: 600},
		{id: 1262, name: '04 - Ponte dos Carvalhos 02', code: 700},
		{id: 1589, name: '12 - Praias Cabo', code: 500},
		{id: 1522, name: '11 - Ipojuca', code: 400},
		{id: 1203, name: '01 - Escritorio', code: 000},
		{id: 1803, name: '1000 - Desistentes', code: 1000}
	];
	let info = 'Informe o Arrecadador';
	for (let index = 0; index < collectors.length; index++) {
	info += '\n' + index + ' ' + collectors[index].name;
	}
    let id = prompt(info);
    codeAvailable = parseInt(prompt("Codigo - " + collectors[id].code), 10);
    startCodeSeller = collectors[id].code;
    idCollector = collectors[id].id;
    getSellers(collectors[id]);
}

main();
