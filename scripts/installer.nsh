; Custom NSIS installer script for aimii.app
; Adds region selection and GDPR consent functionality

!include "nsDialogs.nsh"
!include "LogicLib.nsh"
!include "WinMessages.nsh"

; Variables for region and consent
Var RegionSelection
Var ConsentGiven
Var ShowConsentPage

; Custom page for region selection
Page custom RegionSelectionPage RegionSelectionPageLeave

; Custom page for GDPR consent (conditional)
Page custom ConsentPage ConsentPageLeave

; Use default uninstaller pages

; Region Selection Page
Function RegionSelectionPage
  nsDialogs::Create 1018
  Pop $0

  ; Set custom page title and subtitle
  SendMessage $HWNDPARENT ${WM_SETTEXT} 0 "STR:aimii Setup"
  GetDlgItem $0 $HWNDPARENT 1037
  SendMessage $0 ${WM_SETTEXT} 0 "STR:Welcome to aimii"
  GetDlgItem $0 $HWNDPARENT 1038
  SendMessage $0 ${WM_SETTEXT} 0 "STR:"

  ${NSD_CreateLabel} 0 0 100% 30u "This app helps you maintain consistent mouse sensitivity across different FPS games."
  Pop $0

  ${NSD_CreateCheckBox} 0 120u 300u 15u "I am located in the European Union (EU)"
  Pop $1

  ${NSD_CreateLabel} 0 140u 100% 20u "Do not select this if you live in Canada, United States, or other non-EU countries."
  Pop $0

  ; Default to unchecked (non-EU)
  StrCpy $RegionSelection "OTHER"
  StrCpy $ShowConsentPage "0"

  ; Set up callback
  ${NSD_OnClick} $1 RegionToggle

  nsDialogs::Show
FunctionEnd

Function RegionToggle
  Pop $0 ; Get the checkbox handle
  ${NSD_GetState} $0 $1
  ${If} $1 == ${BST_CHECKED}
    StrCpy $RegionSelection "EU"
    StrCpy $ShowConsentPage "1"
  ${Else}
    StrCpy $RegionSelection "OTHER"
    StrCpy $ShowConsentPage "0"
  ${EndIf}
FunctionEnd

Function RegionSelectionPageLeave
  ; Write region to registry
  WriteRegStr HKCU "Software\aimii\Privacy" "Region" $RegionSelection
FunctionEnd

; GDPR Consent Page (only shown for EU users)
Function ConsentPage
  ${If} $ShowConsentPage != "1"
    Abort ; Skip this page if not EU
  ${EndIf}

  nsDialogs::Create 1018
  Pop $0

  ${NSD_CreateLabel} 0 0 100% 40u "As an EU resident, we need your consent to process your data according to GDPR regulations. This includes storing your sensitivity settings and game preferences locally on your device."
  Pop $0

  ${NSD_CreateCheckBox} 0 50u 300u 15u "I consent to the processing of my data as described"
  Pop $1

  ${NSD_CreateLabel} 0 70u 100% 40u "You can withdraw this consent at any time through the application settings. Without consent, some features may not be available."
  Pop $0

  ; Set up callback
  ${NSD_OnClick} $1 ConsentToggle

  StrCpy $ConsentGiven "0"

  nsDialogs::Show
FunctionEnd

Function ConsentToggle
  Pop $0 ; Get the checkbox handle
  ${NSD_GetState} $0 $1
  ${If} $1 == ${BST_CHECKED}
    StrCpy $ConsentGiven "1"
  ${Else}
    StrCpy $ConsentGiven "0"
  ${EndIf}
FunctionEnd

Function ConsentPageLeave
  ${If} $ShowConsentPage == "1"
    ; Write consent status to registry
    WriteRegStr HKCU "Software\aimii\Privacy" "ConsentGiven" $ConsentGiven
    WriteRegStr HKCU "Software\aimii\Privacy" "ConsentDate" "${__DATE__}"
  ${EndIf}
FunctionEnd

; Hook into existing initialization using macro
!macro customInit
  StrCpy $RegionSelection "OTHER"
  StrCpy $ConsentGiven "0"
  StrCpy $ShowConsentPage "0"
  ; Set installation mode to all users and default directory
  SetShellVarContext all
  StrCpy $InstDir "$PROGRAMFILES\aimii"
!macroend

; Removed custom uninstaller code - using defaults

; Removed complex macro - using simple approach instead