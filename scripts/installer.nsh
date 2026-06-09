; Custom NSIS installer script for aimii.app
; Shows an informational CMP privacy notice before installation. Region/CMP detection
; happens at runtime via Overwolf's CMP API; the in-app FTUE shows the first layer for
; EU users and the Privacy section in Settings is available to all users.

!include "nsDialogs.nsh"
!include "LogicLib.nsh"
!include "WinMessages.nsh"

; EM_SETREADONLY normally comes from WinMessages.nsh; guard in case it isn't defined.
!ifndef EM_SETREADONLY
  !define EM_SETREADONLY 0x00CF
!endif

; Custom informational page shown before install
Page custom PrivacyNoticePage

Function PrivacyNoticePage
  nsDialogs::Create 1018
  Pop $0

  ; Header text
  SendMessage $HWNDPARENT ${WM_SETTEXT} 0 "STR:aimii Setup"
  GetDlgItem $0 $HWNDPARENT 1037
  SendMessage $0 ${WM_SETTEXT} 0 "STR:Privacy Notice"
  GetDlgItem $0 $HWNDPARENT 1038
  SendMessage $0 ${WM_SETTEXT} 0 "STR:Please review before installing."

  ${NSD_CreateLabel} 0 0 100% 100% "aimii may display in-app ads to help provide you with a free high-quality app. In order to deliver ads that are relevant for you, aimii and trusted third-party ad partners store and/or access information on your computer, and process personal data such as IP address and cookies.$\r$\n$\r$\nYou can manage your consent preferences at any time from the Privacy section in the app's settings. Click 'Manage' there to control your consents, or to object to the processing of your data when done on the basis of legitimate interest.$\r$\n$\r$\nPurposes we use: Store and/or access information on a device, personalized ads and content, ad and content measurement, audience insights and product development."
  Pop $0

  nsDialogs::Show
FunctionEnd

; Read-only "Installation folder" page shown right before installing — uniform with the OW
; custom installer's locked folder field. Inserted via customPageAfterChangeDir, which runs
; after the install mode is resolved, so $INSTDIR holds the real per-user path.
!macro customPageAfterChangeDir
  Page custom InstallDirInfoPage
!macroend

Function InstallDirInfoPage
  nsDialogs::Create 1018
  Pop $0

  GetDlgItem $0 $HWNDPARENT 1037
  SendMessage $0 ${WM_SETTEXT} 0 "STR:Installation folder"
  GetDlgItem $0 $HWNDPARENT 1038
  SendMessage $0 ${WM_SETTEXT} 0 "STR:aimii will be installed in the location below."

  ${NSD_CreateLabel} 0 0 100% 16u "aimii will be installed to:"
  Pop $0

  ${NSD_CreateText} 0 20u 100% 12u "$INSTDIR"
  Pop $1
  SendMessage $1 ${EM_SETREADONLY} 1 0

  nsDialogs::Show
FunctionEnd

; Cleanup on uninstall
!macro customUnInstall
  ; Skip all cleanup during an auto-update — electron-updater runs this uninstaller as
  ; part of applying the update. ${isUpdated} is true in that case; without this guard
  ; the RMDir below would wipe the user's settings (%APPDATA%\aimii.app) on every update.
  ; On a genuine user uninstall ${isUpdated} is false and the cleanup runs as normal.
  ${ifNot} ${isUpdated}
    ; Do not call SetShellVarContext here — electron-builder's perMachine template sets
    ; SetShellVarContext all, which makes $APPDATA resolve to C:\ProgramData. Use
    ; ReadEnvStr to get the actual current user's APPDATA from the environment instead.
    ReadEnvStr $R0 APPDATA
    RMDir /r "$R0\aimii.app"
    ReadEnvStr $R0 LOCALAPPDATA
    RMDir /r "$R0\aimii.app-updater"
    ; Remove registry entries (including legacy Privacy/Region values from prior installs)
    DeleteRegKey HKCU "Software\aimii"
    ; Remove install directory. /REBOOTOK schedules any locked files for silent deletion
    ; at next reboot (no prompt). SetRebootFlag false suppresses the reboot dialog.
    RMDir /r /REBOOTOK "$INSTDIR"
    SetRebootFlag false
  ${endif}
!macroend

; Force a per-user install and skip the "Choose Installation Options" (all users / current
; user) page entirely, matching the OW custom installer: locked per-user into
; %LOCALAPPDATA%\Programs\aimii.app, no prompt, no UAC. app-builder-lib's install-mode page
; PRE function (multiUserUi.nsh) reads $isForceCurrentInstall and Aborts — skipping the
; page — when it is "1". oneClick stays false so the Privacy notice page above still shows.
!macro customInstallMode
  StrCpy $isForceCurrentInstall "1"
!macroend

; No customInit InstDir override: install location is left to electron-builder's per-user
; default (%LOCALAPPDATA%\Programs\aimii.app) so updates apply silently without UAC, which
; perMachine:false requires. Forcing $PROGRAMFILES64 here would need elevation the silent
; auto-updater can't obtain, leaving setup.exe hung.
