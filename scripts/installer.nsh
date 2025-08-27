; Custom NSIS installer script for aimii.app
; Adds region selection and GDPR consent functionality

!include "nsDialogs.nsh"
!include "LogicLib.nsh"

; Variables for region and consent
Var RegionSelection
Var ConsentGiven
Var ShowConsentPage

; Custom page for region selection
Page custom RegionSelectionPage RegionSelectionPageLeave

; Custom page for GDPR consent (conditional)
Page custom ConsentPage ConsentPageLeave

; Region Selection Page
Function RegionSelectionPage
  nsDialogs::Create 1018
  Pop $0

  ${NSD_CreateLabel} 0 0 100% 20u "Please select your region for privacy compliance:"
  Pop $0

  ${NSD_CreateRadioButton} 10u 30u 200u 15u "European Union (EU)"
  Pop $1

  ${NSD_CreateRadioButton} 10u 50u 200u 15u "United States"
  Pop $2

  ${NSD_CreateRadioButton} 10u 70u 200u 15u "Other"
  Pop $3

  ; Default to "Other"
  ${NSD_Check} $3
  StrCpy $RegionSelection "OTHER"

  ; Set up callbacks
  ${NSD_OnClick} $1 RegionEU
  ${NSD_OnClick} $2 RegionUS
  ${NSD_OnClick} $3 RegionOther

  nsDialogs::Show
FunctionEnd

Function RegionEU
  StrCpy $RegionSelection "EU"
  StrCpy $ShowConsentPage "1"
FunctionEnd

Function RegionUS
  StrCpy $RegionSelection "US"
  StrCpy $ShowConsentPage "0"
FunctionEnd

Function RegionOther
  StrCpy $RegionSelection "OTHER"
  StrCpy $ShowConsentPage "0"
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

  ${NSD_CreateCheckBox} 10u 50u 300u 15u "I consent to the processing of my data as described"
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
!macroend