$message = @"
Version 0.1.0: First beta release

Features:
- Login/Register/Logout
- Home screen with subject list
- Exam list screen with exam list
- Exam detail screen with exam detail
- Exam result screen with exam result
- Profile screen with profile information
- Settings screen with settings information
"@
git commit -m "Version 0.1.0: First beta release" taginfo.ps1
git tag -a v0.1.0 -m $message
