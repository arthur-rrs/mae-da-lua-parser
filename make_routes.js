function getUrl(collector) {
	let url = 'http://gestor.dasorte.com/redepos/comum-vendedor/dados?enderecos=1&id_modelo=270&secao=principal&parametros=id_arrecadador:arrecadador:Arrecadador:IGUAL:%id::%name::false:;&results=50&sortCol=codigo&sortDir=ASC&startIndex=0&__seq=490241';
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
			id: row[1].innerHTML,
			code: row[9].innerHTML,
			name: row[7].innerHTML,
			namefull: row[8].innerHTML,
			login: row[19].innerHTML,
			terminais: row[23].innerHTML,
			othersInfo: row[21].innerHTML.split('@'),
			collector: this
		};
		json.push(seller);
	}

	return json;
}

function printSellers(sellers) {
	let size = sellers.length;
	let $body = mounttable(sellers[0].collector);
	let $tbody = $body.find('tbody');
	let seller = null;
	for (let index = 0; index < size; index++) {
		seller = sellers[index];
		$row = '<tr>' + 
			       '<td>' + seller.code + '</td>' +
			       '<td>' + seller.namefull + '</td>' +
			       '<td>' + seller.terminais + '</td>' +
						 '<td>' + seller.login + '</td>' +
						 '<td>' + 
								seller.othersInfo[0] + ' . ' +
								seller.othersInfo[1] + ' . ' +
								seller.othersInfo[4] + ' . ' +
						 '</td>' +
						 '<td>' + seller.othersInfo[5] + '</td>' +
			     '</tr>';
		$tbody.append($row);
	}
}

function mounttable(collector) {
	jQuery('head').empty();
	jQuery('head').append('<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/css/bootstrap.min.css" integrity="sha384-Gn5384xqQ1aoWXA+058RXPxPg6fy4IWvTNh0E263XmFcJlSAwiGgFAW/dAiS6JXm" crossorigin="anonymous">');
	let $body = jQuery('body');
	$body.css('background-color', 'white');
	$body.addClass('container');
	$body.empty();
	$body.append('<div class="row"><div class="col-md-12"><h1>Rota de Arrecadação </h1></div>');
	$body.append('<div class="row"><div class="col-md-12"><h4>' + collector.name + '</h4></div></div>');
	$body.append('<div class="row"><div class="col-md-12"><h5>Avisos </h5></div>');
	$body.append('<div class="row"><div class="col-md-12"><textarea class="form-control"></textarea></div>');
	$body.append('<hr>');
	let table = '<div class="row"><div class="col-md-12"><table class="table table-bordered">' +
			          '<thead>' +
			              '<tr>' +
			                '<th>Codigo</th>'+
			                '<th>Nome</th>'+
			                '<th>Terminais</th>'+
			                '<th>Login</th>'+
			                '<th>Endereco</th>'+
											'<th>Telefone</th>'+
			              '</tr>' +
			          '</thead>' +
								'<tbody>' + 
			          '</tbody>' +
			        '</table></div></div>';
	$body.append(table);
	
	return $body;
}

function main() {
	let collectors = [
		{id: 1337, name: '09 - Cabo 01'},
		{id: 1759, name: '14 - Cabo 02'},
		{id: 1662, name: '13 - Ponte dos Carvalhos 01'},
		{id: 1262, name: '04 - Ponte dos Carvalhos 02'},
		{id: 1589, name: '12 - Praias Cabo'},
		{id: 1522, name: '11 - Ipojuca'},
		{id: 1203, name: '01 - Escritorio'}
	];
	let info = 'Informe o Arrecadador';
	for (let index = 0; index < collectors.length; index++) {
	info += '\n' + index + ' ' + collectors[index].name;
	}
	let id = prompt(info);
	getSellers(collectors[id]);
}

main();
