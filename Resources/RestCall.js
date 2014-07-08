exports.doRestCall = function(callback, append_url, data) {
	var conn = Titanium.App.Properties.getString('conn_current');
	if(!conn){
		alert('Connection Error! Please check the connection information. No connection info set.');
		return;
	}
	conn = JSON.parse(conn);
	var restURL = conn.method + '://' + conn.ipaddress + ':' + conn.port + '/rest/';
	var url = restURL + append_url;
	var authString = conn.username + ':' + conn.password;
	var b64encodedAuthString = Ti.Utils.base64encode(authString.toString());
	Ti.API.info('url: ' + url);
	var xhr = Ti.Network.createHTTPClient({
		validatesSecureCertificate : false,
		onload : function(xhre) {
			//todo: why does this still fire when undefined is here.
			//todo: refactor and use typeof
			if (callback != 'undefined' && callback != null && data != 'undefined' && data != null) {
				if(this.responseData == 'undefined' || this.responseData == null || this.responseData == '') {
					alert('No updated data found.  Please check the connection information.');
					return false;
				} else {
					callback(this, data);
				}
			} else if (callback != null && callback != 'undefined') {
				callback(this);
			}
			return true;
		},
		onerror : function(xhre) {
			alert('Connection Error! Please check the connection information. URL: ' + url + " User: " + conn.username);
			Ti.API.info('Error: ' + this.responseText);
			return false;
		},
		timeout : 10000
	});

	xhr.open('GET', url);
	xhr.setRequestHeader('Accept', 'application/xml');
	xhr.setRequestHeader('Authorization', 'Basic ' + b64encodedAuthString);
	// send the data
	xhr.send();
};