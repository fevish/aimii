import { ipcRenderer } from 'electron';

let hideTimeout: NodeJS.Timeout | null = null;

function exclusiveModeUpdated(info: any) {
  console.log('exclusive mode updates', info);

  if (info.eventName === 'enter') {
    if (hideTimeout) {
      clearTimeout(hideTimeout);
      hideTimeout = null;
    }

    const notificationText = document.querySelector('.notification-text');
    if (notificationText) {
      notificationText.classList.add('hide');
    }

    _updateHotkeyHtml(info);

    document.body.classList.add('active');
  }
  if (info.eventName === 'exit') {
    document.body.classList.remove('active');

    hideTimeout = setTimeout(() => {
      ipcRenderer.send('HIDE_EXCLUSIVE');
    }, 1000);
  }
}

function _updateHotkeyHtml(info: any) {
  let className = '.notification-text-dock';
  let label = '<h1>to return to the game (owe)</h1>';
  let html = '';
  if (info.hasOwnProperty('releaseHotkeyString') && info.releaseHotkeyString) {
    let hotkeys = info.releaseHotkeyString.split('+');

    for (let hotkey of hotkeys) {
      html += "<span class='hotkey'>" + hotkey + '</span>';
    }
    html += label;
  } else {
    html = label;
  }
  const classElement = document.querySelector(className);
  if (classElement) {
    classElement.innerHTML = html;
    classElement.classList.remove('hide');
  }
}

// Define a function to handle visibility changes
function handleVisibilityChange() {
  if (document.visibilityState === 'visible') {
    exclusiveModeUpdated({
      eventName: 'enter',
      releaseHotkeyString: 'Ctrl+Tab',
    });
  }
}

// Attach the event listener to the document
document.addEventListener('visibilitychange', handleVisibilityChange);
handleVisibilityChange();

ipcRenderer.on('EXCLUSIVE_MODE', (event, enter) => {
  exclusiveModeUpdated({
    eventName: enter ? 'enter' : 'exit',
    releaseHotkeyString: 'Ctrl+Tab',
  });
});
