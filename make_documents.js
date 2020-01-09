function getUrl(collector) {
	console.info("Arrecadadores");
	console.log(collector);
	let url = 'http://gestor.dasorte.com/redepos/comum-vendedor/dados?enderecos=1&id_modelo=270&secao=principal&parametros=id_arrecadador:arrecadador:Arrecadador:IGUAL:%id::%name::false:;&results=100&sortCol=codigo&sortDir=ASC&startIndex=0&__seq=490241';
	let newurl = url.replace('%id', collector.id).replace('%name', collector.name);
	
	return newurl;
}

function getSellers(collector) {
	url = getUrl(collector); 
	jQuery.ajax(url, {
		dataFilter: transformXmlInJson.bind(collector),
		success: printSellers
	});
}

function transformXmlInJson(data) {
	let rows = data.children[0].children;
	let json = [];
	let size = rows.length;
	let row = null;
	let seller = {};
	for (let index = 0; index < size; index++) {
		row = rows[index].children;
		seller = {
			login: row[23].innerHTML,
			code: row[10].innerHTML,
			name: row[9].innerHTML,
			address: row[27].innerHTML.replace(/[@]/g,",").replace(/[0-9]{10,11}/g,""),
			phones: row[27].innerHTML.match(/[0-9]{10,11}/g).toString(),
			terminais: row[29].innerHTML,
			route: row[18].innerHTML
		};
		json.push(seller);
	}

	return json;
}

function printSellers(sellers) {
	console.info( "Vendedores Iniciados");
	console.log( sellers );
	jQuery.ajaxSetup({
		global: false,
		contentType: 'application/json'
	});
   	let url = "https://phasius-api.herokuapp.com/seller";
	jQuery.post(url, JSON.stringify(sellers), function(response) {
		console.log(response);
		console.log("Salvando os vendedores...");
	});
}

function clearAllSellers(cb) {
	jQuery.ajaxSetup({
		global: false,
		contentType: 'application/json'
	});
   	let url = "https://phasius-api.herokuapp.com/seller?refresh";
	jQuery.post(url, JSON.stringify([]), function(response) {
		console.log("Os Vendedores foram apagados.");
		cb();
	});
}

function main() {
	console.log("iniciando...");
	next = function() {
		let collectors = [
		{id: 1337, name: '09 - Cabo 01'},
		{id: 1759, name: '14 - Cabo 02'},
		{id: 1662, name: '13 - Ponte dos Carvalhos 01'},
		{id: 1262, name: '04 - Ponte dos Carvalhos 02'},
		{id: 1589, name: '12 - Praias Cabo'},
		{id: 1522, name: '11 - Ipojuca'},
		{id: 1203, name: '01 - Escritorio'}
		];
		getSellers(collectors[0]);
		/**
		for (let index = 0; index < collectors.length; index++) {
		
			getSellers(collectors[index]);
		}
		*/
	};
	clearAllSellers(next);
}

main();
