function getUrl(collector) {
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
function transformPhone(phone) {
    phone=phone.replace(/\D/g,"");             //Remove tudo o que não é dígito
    phone=phone.replace(/^(\d{2})(\d)/g,"($1) $2"); //Coloca parênteses em volta dos dois primeiros dígitos
    phone=phone.replace(/(\d)(\d{4})$/,"$1-$2");    //Coloca hífen entre o quarto e o quinto dígitos
    return phone;
} 
function transformXmlInJson(data) {
	let rows = data.children[0].children;
	let json = [];
	let size = rows.length;
	let row = null;
	let seller = {};
	for (let index = 0; index < size; index++) {
		row = rows[index].children;
		console.log(row);
		seller = {
			id: row[1].innerHTML,
			code: row[10].innerHTML,
			name: row[9].innerHTML,
			namefull: row[8].innerHTML,
			login: row[21].innerHTML,
			terminais: row[25].innerHTML,
			othersInfo: row[23].innerHTML.split('@'),
			collector: this,
			updateDate: transformToDate(row[3].innerHTML)
		};
		json.push(seller);
	}

	return json;
}

function printSellers(sellers) {
	let size = sellers.length;
	let $body = mounttable(sellers[0].collector, size);
	let $tbody = $body.find('tbody');
	let seller = null;
	for (let index = 0; index < size; index++) {
		seller = sellers[index];
		let isNewSeller =  seller.updateDate > ( Date.now() - 604800000 );
		if (isNewSeller) {
		  seller.namefull = '<b>' + seller.namefull + '</b>';	
		}
		let phonesOutput = '';
		let phones = seller.othersInfo[5].split('-');
		for (let phoneIndex = 0; phoneIndex < phones.length; phoneIndex++) {
		  if (phones[phoneIndex] == "") {
		     continue; 
		  }
		  phonesOutput += transformPhone( phones[phoneIndex] ) + '<br>';
			
		}
		$row = '<tr>' + 
			       '<td>' + seller.code + '</td>' +
			       '<td>' + seller.name + '</td>' +
			       '<td>' + seller.terminais + '</td>' +
						 
			       '<td>' + 
								seller.othersInfo[0] + ' . ' +
								seller.othersInfo[1] + ' . ' +
								seller.othersInfo[4] + ' . ' +
						 '</td>' +
						 '<td  width="200px">' + phonesOutput + '</td>' +
			     '</tr>';
		$tbody.append($row);
	}
}

function transformToDate(updateInfo) {
   var day = parseInt(updateInfo.substring(0, 2), 10);
   var month = 	parseInt(updateInfo.substring(3, 5), 10) - 1; 
   var year = parseInt(updateInfo.substring(6, 10), 10);
	
   return (new Date(year, month, day)).getTime();	
}

function mounttable(collector, size) {
	jQuery('head').empty();
	jQuery('head').append('<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/css/bootstrap.min.css" integrity="sha384-Gn5384xqQ1aoWXA+058RXPxPg6fy4IWvTNh0E263XmFcJlSAwiGgFAW/dAiS6JXm" crossorigin="anonymous">');
	let $body = jQuery('body');
	$body.css('background-color', 'white');
	$body.addClass('container');
	$body.empty();
	$body.append('<div class="row"><div class="col-md-12"><h1>Rota de Arrecadação </h1></div>');
	$body.append('<div class="row"><div class="col-md-12"><h4>' + collector.name + '</h4></div></div>');
	$body.append('<div class="row"><div class="col-md-12"><h5>Avisos </h5></div>');
	$body.append('<div class="row"><div class="col-md-12"><textarea style="font-size:30px;font-weight: bold;" class="form-control"></textarea></div>');
	$body.append('<hr>');
	$body.append('<div class="row"><div class="col-md-12"><p><small>Quantidade atual de vendedores: ' + size + '</small></p></div></div>');
	let table = '<div class="row"><div class="col-md-12"><table class="table table-bordered">' +
			          '<thead>' +
			              '<tr>' +
			                '<th>Codigo</th>'+
			                '<th>Nome</th>'+
			                '<th>Terminais</th>'+
			                '<th>Endereco</th>'+
					'<th  width="200px">Telefone</th>'+
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
