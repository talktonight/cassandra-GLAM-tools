var ACTIVE_ITEM_ID;

function getUrl() {
	var db = window.location.href.toString().split('/')[3];
	var groupby = $('#groupby-select').val();
	return "/api/"+db+"/file/upload-date?groupby=" + groupby;
}

function getUrlDataset() {
	var db = window.location.href.toString().split('/')[3];
	return "/api/"+db+"/file/upload-date/dataset";
}

function getUrlAll(){
	var db = window.location.href.toString().split('/')[3];
	var groupby = $('#groupby-select').val();
	return "/api/"+db+"/file/upload-date-all?groupby=" + groupby;
}

function pad(str, max) {
  str = str.toString();
  return str.length < max ? pad("0" + str, max) : str;
}

function sidebar(type) {
		var template_source = "/views/user-contributions/tpl/user-contributions.tpl";
		var target = "#right_sidebar_list";

		$.get(template_source, function(tpl) {
				$.getJSON(getUrl(), function(data) {
						data.forEach(function (d) {
								let total = 0;

								d.files.forEach(function (d) {
										total += +d.count
								})
								d.total = total;

								d.user_id = d.user.replace(/\s/g, "_");
						});

			      if (type === "by_num") {
								data = data.sort(function(a,b) {
									return b.total - a.total;
								});
						} else {
							data = data.sort(function(a,b) {
								if (a.user < b.user) { return -1; }
								if (a.user > b.user) { return 1; }
								return 0;
							});
						}

						data.forEach(function (d) {
								d.total = nFormatter(d.total);
						})

						var template = Handlebars.compile(tpl);
						$(target).html(template({"users": data}));

						highlight();
				});
		});
}

function sorting_sidebar() {
	$("#by_num").on("click", function() {
		if ($("#by_num").hasClass("active_order") ) {
			//console.log("già selezionato")
		} else {
			$("#by_name").toggleClass("active_order");
			$("#by_num").toggleClass("active_order");
			sidebar("by_num");
			$("#by_num").css("cursor","default");
			$("#by_name").css("cursor","pointer");
		}
	});

	$("#by_name").on("click", function() {
		if ($("#by_name").hasClass("active_order") ) {
			//console.log("già selezionato")
		} else {
			$("#by_name").toggleClass("active_order");
			$("#by_num").toggleClass("active_order");
			sidebar("by_name");
			$("#by_name").css("cursor","default");
			$("#by_num").css("cursor","pointer");
		}
	});
}

function download() {
	$('<a href="' + getUrlDataset() + '" download="' + "user_contributions.csv" + '">Download dataset</a>').appendTo('#download_dataset');
}

function highlight() {
	if (ACTIVE_ITEM_ID !== undefined) {
		$('#' + ACTIVE_ITEM_ID).closest('.list_item').addClass('list_item_active');
	}

	$(".list_item").on("click", function() {

		var element = $(this).find('.item').attr("id");

		// highlight Sidebar and show bars
		if ($(this).hasClass('list_item_active')) {
			hideUserContributionsBars();
			$(".list_item").removeClass("list_item_active");
			ACTIVE_ITEM_ID = undefined;
		} else {
			showUserContributionsBars(element);
			$(".list_item").removeClass("list_item_active");
			ACTIVE_ITEM_ID = element;
			$(this).addClass("list_item_active")
		}

	});
}

$(document).ready(function() {
		setCategory();
		sidebar("by_num");
		dataviz();
		how_to_read();
		download();
		switch_page();
		sorting_sidebar();
		$('#groupby-select').change(function() {
			dataviz();
		});
})
