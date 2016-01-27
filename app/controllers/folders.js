var _args = arguments[0] || {}, // Any passed in arguments will fall into this property
    folders = null, // Array placeholder for all folders
    indexes = [];
// Array placeholder for the ListView Index (used by iOS only);

/**
 * Function to initialize the View, sets up the ListView
 */
function init() {

	//Get All of the devices and the folders they are in
	var deviceInFolderTable = Alloy.Collections.deviceInFolder.config.adapter.collection_name;
	var folderInViewTable = Alloy.Collections.folderInView.config.adapter.collection_name;
	var deviceTable = Alloy.Collections.device.config.adapter.collection_name;

	var sql = "SELECT " + deviceTable + ".id, " + deviceTable + ".name, " + deviceTable + ".displayName, " + deviceTable + ".address, " + deviceTable + ".type, " + 
		folderInViewTable + ".ViewId, " + folderInViewTable + ".SortId as folderInViewSortId, " +
		deviceInFolderTable + ".folderAddress, " + deviceInFolderTable + ".id, " + deviceInFolderTable + ".SortId as deviceInFolderSortId" + 
		" FROM " + deviceTable + 
		" LEFT JOIN " + deviceInFolderTable + 
		" ON " + deviceInFolderTable + ".deviceAddress = " + deviceTable + ".address" + 
		" LEFT JOIN " + folderInViewTable + 
		" ON " + folderInViewTable + ".FolderAddress = " + deviceTable + ".address";
	
	Alloy.Collections.device.fetch({
		query : sql,
		success : function(data) {
			Ti.API.info("data: " + JSON.stringify(data));
			processDevicesInFolders(data.toJSON(), VIEW_ID_FAVORITES);
			processDevicesInFolders(data.toJSON(), VIEW_ID_LIGHTS);
			processDevicesInFolders(data.toJSON(), VIEW_ID_SCENES);
		},
		error : function() {
			Ti.API.debug("refreshDevicesInFolder Failed!!!");
		}
	});
}

function processDevicesInFolders(devicesAndFolders, viewId) {
	Ti.API.info("viewId: " + viewId);
	//Filter the folders themselves out of the list before grouping.
	//filter out the ones that aren't for this viewId.
	var listOfFolders = [];
	var devices = _.filter(devicesAndFolders, function(folder) {
		if (folder.type == "folder" && folder.ViewId == viewId) {
			listOfFolders.push(folder);
		} else {
			return folder.type != "folder";
		}

	});
	
	//Group all the devices that are in the same Folder
	var devicesGrouped = _.groupBy(devices, 'FolderAddress');

	//Find the folder where the devices should be located and add the devices to that folder
	_.each(devicesGrouped, function(ds, i) {
		var f = _.findWhere(listOfFolders, {
			address : i
		});
		//If it's not in a folder don't display it.
		if (f) {
			f.devices = ds;
		}
	});

	//sort all the folders
	var folders = _.sortBy(listOfFolders, 'folderInViewSortId');

	//Sort the devices within the folder
	_.each(folders, function(folder) {
		folder.devices = _.sortBy(folder.devices, 'deviceInFolderSortId');
	});

	if (folders) {
		/**
		 * Setup our Indexes and Sections Array for building out the ListView components
		 *
		 */
		indexes = [];
		var sections = [];



		// /**
		// * Iterate through each folder and prepare the data for the ListView
		// * (Leverages the UnderscoreJS _.each function)
		// */
		_.each(folders, function(folder, i) {
			/**
			 * Take the group data that is passed into the function, and parse/transform
			 * it for use in the ListView templates as defined in the folders.xml file.
			 */
			var dataToAdd = preprocessForListView(folder.devices);
			/**
			 * Check to make sure that there is data to add to the table,
			 * if not lets exit
			 */
			if (dataToAdd.length < 1)
				return;

			/**
			 * Lets take the name of the Folder and push it onto the index
			 * Array - this will be used to generate the indices for the ListView on IOS
			 */
			indexes.push({
				index : indexes.length,
				title : folder.displayName
			});

			/**
			 * Create the ListViewSection header view
			 */

			var sectionHeader = Ti.UI.createView();

			/**
			 * Create and Add the Label to the ListView Section header view
			 */
			var sectionLabel = Ti.UI.createLabel({
				text : folder.displayName
			});

			/**
			 * Add the correct style to the label dynamically.
			 */
			var rowGroupStyle = $.createStyle({
				classes : 'groupLbl'
			});
			sectionLabel.applyProperties(rowGroupStyle);

			sectionHeader.add(sectionLabel);

			/**
			 * Create a new ListViewSection, and ADD the header view created above to it.
			 */
			var section = Ti.UI.createListSection({
				headerView : sectionHeader
			});

			/**
			 * Add Data to the ListViewSection
			 */
			section.items = dataToAdd;

			/**
			 * Push the newly created ListViewSection onto the `sections` array. This will be used to populate
			 * the ListView
			 */
			Ti.API.info("sections: " + JSON.stringify(section));
			sections.push(section);
		});

		//There is probably a better way to do this instead of hardcoding the views
		Ti.API.info("sections: " + JSON.stringify(sections));
		if(viewId===VIEW_ID_FAVORITES){
			$.favoritesListView.sections = sections;	
		} else if (viewId===VIEW_ID_LIGHTS){
			$.lightsListView.sections = sections;	
		} else if (viewId==VIEW_ID_SCENES) {
			$.scenesListView.sections = sections;
		}
		
	}
}

/**
 *	Convert an array of data from a JSON format into a format that can be added to the ListView
 *
 * 	@param {Object} Raw data elements from the JSON file.
 */
var preprocessForListView = function(rawData) {
	/**
	 * Using the rawData collection, we map data properties of the folders in this array to an array that maps an array to properly
	 * display the data in the ListView based on the templates defined in directory.xml (levearges the _.map Function of UnderscoreJS)
	 */
	return _.map(rawData, function(item) {
		/**
		 * Create the new device object which is added to the Array that is returned by the _.map function.
		 */
		return {
			template : "lightTemplate",
			properties : {
				searchableText : item.displayName,
				modelId : item.id,
				light : item,
			},
			btn : {
				title : item.displayName,
				address : item.address,
				type : item.type
			},
			slider : {
				value : item.sliderVal
			},
			sliderLbl : {
				text : item.sliderVal
			},
		};
	});
};

/**
 * This function handles the click events for the rows in the ListView.
 *
 * @param {Object} Event data passed to the function
 */
function onItemClick(e) {
	/**
	 * Get the Item that was clicked
	 */
	var item = $.favoritesListView.sections[e.sectionIndex].items[e.itemIndex];

	// Alloy.Globals.Navigator.open("profile", item.properties.user);
}

/**
 * event listener set via view to provide a search of the ListView.
 * @param  {Object} e Event
 */
// $.sfFav.addEventListener('change',function(e){
	// $.favoritesListView.searchText = e.value;
// });

$.sfLights.addEventListener('change',function(e){
	$.lightsListView.searchText = e.value;
});

$.sfScenes.addEventListener('change',function(e){
	$.scenesListView.searchText = e.value;
});


/**
 * Hide Bookmark Icon (Android)
 */
$.wrapper.addEventListener("open", function onWindowOpen() {
	if (OS_ANDROID && _args.restrictToFavorites) {

		var activity = $.wrapper.getActivity();
		activity.onCreateOptionsMenu = function(e) {
			e.menu.clear();
		};
		activity.invalidateOptionsMenu();
	}
});

/**
 * Listen for the refresh event, and re-initialize
 */
Ti.App.addEventListener("refresh-data", function(e) {
	init();
});

/**
 * Initialize View
 */
init();