function xmlToJson(xml) {
	
	// Create the return object
	var obj = {};

	if (xml.nodeType == 1) { // element
		// do attributes
		if (xml.attributes.length > 0) {
		obj["@attributes"] = {};
			for (var j = 0; j < xml.attributes.length; j++) {
				var attribute = xml.attributes.item(j);
				obj["@attributes"][attribute.nodeName] = attribute.nodeValue;
			}
		}
	} else if (xml.nodeType == 3) { // text
		obj = xml.nodeValue;
	}

	// do children
	if (xml.hasChildNodes()) {
		for(var i = 0; i < xml.childNodes.length; i++) {
			var item = xml.childNodes.item(i);
			var nodeName = item.nodeName;
			if (typeof(obj[nodeName]) == "undefined") {
				obj[nodeName] = xmlToJson(item);
			} else {
				if (typeof(obj[nodeName].push) == "undefined") {
					var old = obj[nodeName];
					obj[nodeName] = [];
					obj[nodeName].push(old);
				}
				obj[nodeName].push(xmlToJson(item));
			}
		}
	}
	return obj;
};

function encode(str) {
  return str.replace(/\\u00e9/g, '&eacute;')
                  .replace(/\\u00f3/g, '&ocirc;')
                  .replace(/\\u00d3/g, '&oacute;')
                  .replace(/\\u00e2/g, '&acirc;')
                  .replace(/\\u00ea/g, '&ecirc;')
                  .replace('/\\u00ea/g', '&eacute')
                  .replace(/\\u00e3/g, '&atilde;')
                  .replace(/\\u00c3/g, '&Atilde;')
                  .replace(/\\u00e1/g, '&aacute;')
                  .replace(/\\u00e7/g, '&ccedil;')
                  .replace(/\\u00fa/g, '&uacute;')
                  .replace(/\\u00f4/g, '&ocirc;')
                  .replace(/\\u00aa/g, '&ordf;');  
};

jQuery.get('http://gestor.dasorte.com/redepos/comum-arrecadador/dados?id_modelo=660&secao=principal&parametros=&results=50&sortCol=codigo&sortDir=ASC&startIndex=0&__seq=581604', null, function (xml) {
  var resultInJSON = xmlToJson(xml);
  var arrecadadores = [];
  var option = 0;
  var buffer = resultInJSON.ResultSet.Result;
  var messagePrompt = 'Escolha um arrecadador para gerar sua rota:\n';
  buffer.forEach(function(arrecadador) {
    	  
    messagePrompt += option + ' : ' + arrecadador.nome_curto['#text'] + '\n';
    
    arrecadadores.push({
      'name'   : arrecadador.nome_curto['#text'],
      'code'   : arrecadador.codigo['#text'],
      'id'     : arrecadador.id['#text']
    });
    option++;
  });
  var answerPrompt = prompt(messagePrompt, 0);
  console.log(arrecadadores[answerPrompt]);
  jQuery.get('http://gestor.dasorte.com/redepos/comum-vendedor/dados?id_modelo=270&secao=principal&parametros=id_arrecadador%3Aarrecadador%3AArrecadador%3AIGUAL%3A'+ arrecadadores[answerPrompt].id+'%3A%3A'+arrecadadores[answerPrompt].code+'%20-%20'+ arrecadadores[answerPrompt].name+'%3A%3Afalse%3A%3B&results=100&sortCol=nome_curto&sortDir=ASC&startIndex=0&__seq=41074', null, function (bf) {
    var vendedores = [];
    var bfe = xmlToJson(bf).ResultSet.Result;
    bfe.forEach( function(vendedor) {
      if (typeof vendedor.associacao['#text'] !== 'undefined' ) {	    
      vendedores.push({
          id       : vendedor.id['#text'],
          name     : vendedor.nome_curto['#text'],
          login    : vendedor.login['#text'],
          POS      : vendedor.associacao['#text'].split(', '),
          idPessoa : vendedor.id_pessoa['#text'],
          phones : []
        });
      }	       
    });
    var phones = [];
    var index = 0;
    vendedores.forEach(function(vendedor) {
      jQuery.get('http://gestor.dasorte.com/redepos/comum-vendedor/dados-telefone?id_pessoa= '+vendedor.idPessoa+'&parametros=&results=10&sortCol=telefone&sortDir=ASC&startIndex=0&__seq=206025', null, function(phone) {
        bfPhone = xmlToJson(phone).ResultSet.Result;
        if (bfPhone instanceof Array) {
          bfPhone.forEach(function(p) {
            phones.push(
              {
              
                phone : p.telefone['#text'],
                idPessoa : p.id_pessoa['#text']
              });
          });
        } else {
          phones.push({
                phone : bfPhone.telefone['#text'],
                idPessoa : bfPhone.id_pessoa['#text']
              });
        }
        
        index++;

        if (index == vendedores.length) {
          console.log('Start.');
          phones.forEach(function(da) {
            for (var inde = 0; inde < vendedores.length; inde++) {
              if (vendedores[inde].idPessoa == da.idPessoa) {
                vendedores[inde].phones.push(da.phone);
              }
            } 
          });
          jQuery.ajaxSettings.beforeSend=function(xhr){
            xhr.setRequestHeader('X-Requested-With', {toString: function(){ return ''; }});
          };
          var lenf = 0;
          var info = [];
          vendedores.forEach(function(vend) {
            jQuery.get('/redepos/comum-vendedor/visualizar?id='+vend.id, null, function(t) {
              var current = {};
              if (t.match(/\"data_hora_criacao\":\"[0-9]{2}\\\/[0-9]{2}\\\/[0-9]{4} [0-9]{2}:[0-9]{2}:[0-9]{2}\"/) !== null) {
	      	mat = t.match(/\"data_hora_criacao\":\"[0-9]{2}\\\/[0-9]{2}\\\/[0-9]{4} [0-9]{2}:[0-9]{2}:[0-9]{2}\"/)[0];
                mat = encode(mat.replace(/\"data_hora_criacao\":\"/, '').replace('"', ''));
		mat = mat.replace(/[0-9]{2}:[0-9]{2}:[0-9]{2}/, '').replace(/\\/g, '');
		var day = parseInt(mat[0]  + '' + mat[1]);
		var month = parseInt(mat[3] + '' + mat[4]) - 1;
		var year =  parseInt( mat[6] + '' + mat[7] + mat[8] + mat[9]);
		current.dateCreated = new Date(year, month, day);
	      }
              if (t.match(/\"endereco":\"[A-z çáéíóúâêîôûãẽĩõũ0-9]+\"/) !== null) {
                mat = t.match(/\"endereco":\"[A-z çáéíóúâêîôûãẽĩõũ0-9/]+\"/)[0];
                current.address = encode(mat.replace(/\"endereco\":\"/, '').replace('"', ''));
              }
              if (t.match(/\"cidade":\"[A-z çáéíóúâêîôûãẽĩõũ0-9]+\"/) !== null) {
                mat = t.match(/\"cidade":\"[A-z çáéíóúâêîôûãẽĩõũ0-9/]+\"/)[0]; 
                current.city = encode ( mat.replace(/\"cidade\":\"/,'').replace('"', '') );
              }
              if (t.match(/\"data_nascimento":\"[0-9]{2}\\\/[0-9]{2}\\\/[0-9]{4}\"/) !== null) {
                mat = t.match(/\"data_nascimento":\"[0-9]{2}\\\/[0-9]{2}\\\/[0-9]{4}\"/)[0];
                current.dateOfBirth = mat.replace(/\"data_nascimento":\"/, '').replace('"', '');
              }
              if (t.match(/\"numero":\"[0-9A-z \\]+\"/) !== null) {
                mat = t.match(/\"numero":\"[0-9A-z \\]+\"/)[0];
                current.number = mat.replace(/\"numero":\"/, '').replace('"', '');
              }
              if (t.match(/\"bairro":\"[A-z çáéíóúâêîôûãẽĩõũ0-9]+\"/) !== null) {
                mat = t.match(/\"bairro":\"[A-z çáéíóúâêîôûãẽĩõũ0-9]+\"/)[0]; 
                current.district = encode ( mat.replace(/\"bairro":\"/, '').replace('"', '') );
              }
              if (t.match(/\"complemento":\"[A-z0-9 çáéíóúâêîôûãẽĩõũ.,-:;]+\"/) !== null) {
                mat = t.match(/\"complemento":\"[A-z0-9 çáéíóúâêîôûãẽĩõũ.,-:;]+\"/)[0];
                current.complement = encode ( mat.replace(/\"complemento":\"/, '').replace('"', '') );
              }
              if (t.match(/\"id_pessoa":\"[0-9]+\"/) !== null) {
                mat = t.match(/\"id_pessoa":\"[0-9]+\"/)[0]; 
                current.idPessoa = mat.replace(/\"id_pessoa":\"/, '').replace('"', '');
              }
              info.push(current);
              lenf++;
              if (lenf == vendedores.length) {
                info.forEach(function(add) {
                  for (buffer = 0; buffer < vendedores.length; buffer++) {
                    if (vendedores[buffer].idPessoa === add.idPessoa) {
                      vendedores[buffer].address = add;
                    } 
                  } 
                });
                vendedores.forEach( function(vendedor) {
                  var url = 'http://gestor.dasorte.com/redepos/cdasorte-relatorio-acompanhamento-vendas-vendedor/dados-relatorio?&parametros=id_tipo_loteria%3Atipo_loteria%3ARegra%20do%20Produto%3AIGUAL%3A150%3A%3APE%20Cap%3A%3Afalse%3A%3Bid_edicao%3Aedicao%3AEdi%E7%E3o%3AIGUAL%3A6475%3A%3APE%20Cap%20-%2024%20-%2025/09/2016%2009-*-00%3A%3Afalse%3A%3Bid_arrecadador%3Aarrecadador%3AArrecadador%3AIGUAL%3A1336%3A%3A08%20-%20Ronaldo%20Rodrigues%20Lima%3A%3Afalse%3A%3B&results=9999&sortCol=percentual_uso_limite&sortDir=DESC&startIndex=0&__seq=80426';
                });
                //Adicionar a View aqui em baixo <vendedores> e a variavel.
                var $body = jQuery('body');
                $body.css('background-color', 'white');
                $body.addClass('container');
                $body.empty();
                $link = jQuery('<link rel="stylesheet" type="text/css" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css">');
                $body.append($link);
                $body.append('<h3>Pernambuco da Sorte</h3>');
                $body.append('<span>Mae da Lua Promocoes e Vendas - Regional Cabo</span>');
                $body.append('<hr>');
                $h1 = jQuery('<h3 class="titulo">Rota de Arrecadacao: '+arrecadadores[answerPrompt].name+'</h3>');
		$p = jQuery('<p> Quantidade de Vendedores: '+vendedores.length+'</p>');
                $body.append($h1);
		$body.append($p);      
                $body.append('<hr>');
                vendedores = vendedores.sort(function(a, b) {
                  if ( a.address.district < b.address.district) {
                    return -1;
                  } else if (a.address.district > b.address.district) {
                    return 1;
                  }
                  return 0;
                  
                });
                $table = jQuery("<table class='table table-bordered table-condensed'><thead><tr>"
                                + "<th>Bairro - Cidade</th>"
                                + "<th>Login</th>"
                                + "<th>Nome</th>"
                                + "<th>Telefones</th>"
                                + "<th>POS</th>"
                                + "<th>Endereco</th>"
                                + "<th>Referencia</th>"
                                + "</tr></thead>"
                                + "<tbody></tbody></table>");
                $tbody = $table.find('tbody');
               	console.log('Iniciar Impressão de Tela!');	
		vendedores.forEach(function(vendedor) {
		  var WEEK = 9 * 24 * 60 * 60 * 1000;
		  var isNewSaler = vendedor.address.dateCreated.valueOf() > (Date.now() - WEEK);	
	          if ( isNewSaler ) {
		  	vendedor.name = "<strong>(Novata(o)) " + vendedor.name + "</strong>";
		  } 

                  phones = '';
                  poss  = '';
                  vendedor.phones.forEach(function(phone) {
                    phones += phone.replace(/([0-9]{2})/, "($1) ").replace(/([0-9]{4,5})/, "$1-");
                    phones += ', ';
                  });
                  vendedor.POS.forEach(function(pos) {
                    poss += pos;
                    poss += ', ';
                  });
		  	
                  $tr = jQuery('<tr' + (isNewSaler ? 'bgcolor="#000000"' : "" ) + '>' 
                                + '<td>' + vendedor.address.district + ' - ' + vendedor.address.city + '</td>'
                                + '<td>' + vendedor.login + '</td>'
                                + '<td>' + vendedor.name + '</td>'
                                + '<td width="130px">' + phones.replace(/[,]/gm, '') + '</td>'
                                + '<td width="90px">' + poss.replace(/,/gm, '<br>') + '</td>'
                                + '<td>' + (vendedor.address.address === undefined ? '' : vendedor.address.address) + ', ' + (vendedor.address.number === undefined ? '' : vendedor.address.number) +  '</td>'
                                + '<td>' + (vendedor.address.complement === undefined ? '' : vendedor.address.complement) + '</td>'
                                + '</tr>'
                              );
                  $tbody.append($tr);
                });
                $table.append($tbody);
                $body.append($table);
		console.log('Fechar Impressão de Tela!');
              }
            });
            
          });
        }
      });
    });
  });
    });
