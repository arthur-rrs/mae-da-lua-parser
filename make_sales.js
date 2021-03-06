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
                current.dateOfBirth = mat.replace(/\"data_na5cimento":\"/, '').replace('"', '');
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
                //Adicionar a View aqui em baixo <vendedores> e a variavel.
                var $body = jQuery('body');
				var $head = jQuery('head');
				$body.css('background-color', '#fff');
				$head.empty();
				$body.empty();
				$link = '<link href="https://arthur-rrs.github.io/mae-da-lua-parser/printer_sales.css" rel="stylesheet">';  
				$head.append(jQuery($link));  
				var $thead = '<thead>';
				$thead += '<tr>';
				$thead += '<th colspan="5">Vendedor<th>';  
				$thead += '</tr>';

				$thead += '<tr>';
				$thead += '<th>Data da Arrecadacao:</th>';
				$thead += '<th></th>';  
				$thead += '<th></th>';  
				$thead += '<th></th>';  
				$thead += '<th></th>';  
				$thead += '<th></th>';  
				$thead += '</tr>';
				$thead += '</thead>'; 
				var $tbody = '<tbody>';
			   	vendedores.forEach(function(vendedor) {
					var $trSaler = '<tr class="divisor-sale cel-without-border">';
					var $trPOS = '';
					$trSaler += '<td class="cel-without-border divisor-sale" colspan="6"><b>' + vendedor.login + ' - ' + vendedor.name + '</b></td>';
					$trSaler += '</tr>';
					$tbody += $trSaler;
					vendedor.POS.forEach(function(pos) {
						$trPOS = '';
						$trPOS += '<tr>';
						$trPOS += '<td>' + pos + '</td>';
						$trPOS += '<td></td>';
						$trPOS += '<td></td>';
						$trPOS += '<td></td>';
						$trPOS += '<td></td>';
						$trPOS += '<td></td>';
						$trPOS += '</tr>';
						$tbody += $trPOS;
					});
				}); 
				var $trFooter = '<tr>';
				$trFooter += '<td>Total: </td>';
				$trFooter += '<td></td>';
				$trFooter += '<td></td>';
				$trFooter += '<td></td>';
				$trFooter += '<td></td>';
				$trFooter += '<td></td>';  
				$trFooter += '</tr>';
				$tbody += $trFooter; 
				$tbody += '</tbody>';  
				var $table = '<table>';
				$table += $thead;  
				$table += $tbody;
				$table += '</table>'; 
				$body.append( jQuery('<h1>' + encode( 'Bordero - Prestacao de Contas') + '</h1> <hr> <p>Arrecadador : ' + arrecadadores[answerPrompt].name + '</p>') );
				$body.append( jQuery( $table) );  
				console.info('EOF!');  
              }
            });
            
          });
        }
      });
    });
  });
    });
