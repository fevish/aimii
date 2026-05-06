; Custom NSIS installer script for aimii.app
; Shows an informational CMP privacy notice before installation. Region/CMP detection
; happens at runtime via Overwolf's CMP API; the in-app FTUE shows the first layer for
; EU users and the Privacy section in Settings is available to all users.

!include "nsDialogs.nsh"
!include "LogicLib.nsh"
!include "WinMessages.nsh"

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

; Cleanup on uninstall
!macro customUnInstall
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
!macroend

!macro customInit
  StrCpy $InstDir "$PROGRAMFILES64\aimii.app"
!macroend
