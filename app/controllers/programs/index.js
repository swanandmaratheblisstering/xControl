'use strict';

var args = arguments[0] || {};

/**
 * self-executing function to organize otherwise inline constructor code
 * @param  {Object} args arguments passed to the controller
 */
(function constructor(args) {
    // execute constructor with optional arguments passed to controller

    // use strict mode for this function scope
    'use strict';

    if (OS_IOS) {
        $.navWin.open();
    } else {
        $.win.open({
    		activityEnterAnimation: Ti.Android.R.anim.slide_in_left,
    		activityExitAnimation: Ti.Android.R.anim.slide_out_right
		});
    }

})(arguments[0] || {});

/**
 * event listener set via view for when the user clicks the close window button.
 * @param  {Object} e Event
 */

function closeProgramsBtnClicked(e) {
    if (OS_IOS) {
        $.navWin.close();
    } else {
        $.win.close();
    }
    $.destroy();
}

function loadFoldersCallback(e) {
	//create the devices controller with the model and get its view
    var params= {
    	"parentId" : e.row.folderId,
        "navWin" : $.navWin
    };
    var win = Alloy.createController('programs/programs', params).getView();

//open the window in the NavigationWindow for iOS
    if (OS_IOS) {
        $.navWin.openWindow(win, {transition: Ti.UI.iPhone.AnimationStyle.FLIP_FROM_LEFT});
    } else {
        win.open({
    		activityEnterAnimation: Ti.Android.R.anim.slide_in_left,
    		activityExitAnimation: Ti.Android.R.anim.slide_out_right
		});   //simply open the window on top for Android (and other platforms)
    }
}


$.programFolders.init({
		"loadFoldersCallback":loadFoldersCallback,
		"navWin":$.navWin
	});
