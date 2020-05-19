/**
 * (c) Copyright by authors of the Tiki Wiki CMS Groupware Project
 *
 * All Rights Reserved. See copyright.txt for details and a complete list of authors.
 * Licensed under the GNU LESSER GENERAL PUBLIC LICENSE. See license.txt for details.
 * $Id: tiki-tasks.js 70137 2019-06-05 01:17:29Z pom2ter $
 */

(function () {
	let newTaskFormEl = $('#modNewTaskForm');

	if (newTaskFormEl) {
		let newTaskBtn = newTaskFormEl.find('input[name="modTasksSave"]');
		let newTaskTitle = newTaskFormEl.find('input[name="modTasksTitle"]');

		newTaskBtn.addClass('disabled');

		newTaskTitle.on('input', function() {
			if (newTaskTitle.val().length >= 3) {
				newTaskBtn.removeClass('disabled');
			} else {
				newTaskBtn.addClass('disabled');
			}
		});

		newTaskFormEl.on('submit', function() {
			return newTaskTitle.val().length >= 3;
		});
	}
})();
