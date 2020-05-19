/**
 * $Id: tablesorter.js 62177 2017-04-10 06:06:43Z drsassafras $
 *
 * Utilities used with tablesorter
 */

/**
 * Fetch rows from an ajax pagination call
 *
 * @param data
 * @param id
 * @param addcol
 * @param total
 * @returns {{}}
 */
function tsAjaxGetRows (data, id, addcol, total)
{
	
	//parse HTML string from entire page
	var parsedpage = $.parseHTML(data), table = $(parsedpage).find(id), r = {};
	//extract table body rows from html returned by smarty template file
	r.rows = $(table).find('tbody tr');
	//add any math total columns
	if (addcol) {
		$.each(addcol, function (key, value) {
			$(r.rows).append('<td data-tsmath="row-' + value['formula'] + '" data-tsmath-filter="*"></td >');
		});
	}
	//tablesorter needs total rows
	r.total = total;
	r.filteredRows = $(table).data('count');
	r.headers = null;
	return r;
}

/**
 * Generate an ajax url
 *
 * @param url
 * @param p
 * @param a
 * @returns {*}
 */
function tsAjaxUrl (url, p, a) {
	var vars = {}, urlparams, oneparam, sorts = false, sortindex, sortkey = 'sort-', filterindex, filterkey = 'filter-',
		params = [], dir, offset, newurl;
	if (a.custom !== false) {
		//parse out url parameters
		urlparams = url.slice(url.indexOf('?') + 1).split('&');
		for(var i = 0; i < urlparams.length; i++) {
			oneparam = urlparams[i].split('=');
			if (oneparam[0].search('sort') > -1) {
				sortindex = parseInt(oneparam[0].substr(5, oneparam[0].length - 6));
				if ($.isNumeric(sortindex)) {
					sortkey = a.colselector ? sortkey + $(a.tableid + ' th:eq(' + sortindex + ')').attr('id')
						: sortkey + sortindex;
					vars[sortkey] = oneparam[1];
				}
			} else if (oneparam[0].search('filter') > -1) {
				filterindex = parseInt(oneparam[0].substr(7, oneparam[0].length - 8));
				if ($.isNumeric(filterindex)) {
					filterkey = a.colselector ? filterkey + $(a.tableid + ' th:eq(' + filterindex + ')').attr('id')
						: filterkey + filterindex;
					vars[filterkey] = oneparam[1];
				}
			}
		}
		//iterate through url parameters
		$.each(vars, function(key, value) {
			//handle sort parameters
			if (a.asort && key in a.asort) {
				dir = value == 0 ? '_asc' : '_desc';
				//add sort if not yet defined or add sort for multiple comma-separated sort parameters
				!sorts ? sorts = a.asort[key] + dir : sorts += ',' + a.asort[key] + dir;
			}
			//handle column and external filter parameters
			if ($.inArray(value, a.extfilters) > -1) {
				params.push(decodeURIComponent(value));
			} else if ($.isPlainObject(a.colfilters) && key in a.colfilters) {
				a.colfilters[key] == value ? params.push(a.colfilters[key][value]) : params.push(a.colfilters[key] + '='
					+ value);
			}
		});
		//convert to tiki sort param sort parameter
		if (sorts) {
			params.push(a.sortparam + '=' + sorts);
		}
		//add any required params
		if (a.requiredparams) {
			$.each(a.requiredparams, function(key, value) {
				params.push(key + '=' + value);
			});
		}
		//offset parameter
		offset = ((p.page * p.size) >= p.filteredRows) ? '' : '&' + a.offset + '=' + (p.page * p.size);
		//build url, starting with no parameters
		newurl = url.slice(0,url.indexOf('?'));
		newurl = newurl + '?' + a.numrows + '=' + p.size + offset + '&tsAjax=y';
		$.each(params, function(key, value) {
			newurl = newurl + '&' + value;
		});
	} else {
		offset = ((p.page * p.size) >= p.filteredRows) ? '' : '&' + a.offset + '=' + (p.page * p.size);
		newurl = url + '&tsAjax=y' + offset + '&numrows=' + p.size;
	}
	return newurl;
}
