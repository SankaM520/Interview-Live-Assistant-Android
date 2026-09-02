# Interview Live Assistant — Android
Target: vivo X300 Pro Chinese ROM / Android 16 / OriginOS 6.

## Important call-audio behavior
This build uses Android SpeechRecognizer with the phone on **speakerphone**. Android/OriginOS restrictions can prevent a third-party app from directly receiving the other party's cellular-call audio. Speakerphone is therefore the intended capture method.

## Features
- Continuous live speech-to-text using the device speech recognizer (no OpenAI transcription API call).
- GET ANSWER sends only the current question plus compact relevant local context to OpenAI.
- Company and Position fields; blank Position defaults to General Accounting / Finance Interview.
- Local CV.pdf storage.
- Local Previous-Answers.txt history.
- Truthful experience protection and structured interview answers.

## Build
Open this folder in Android Studio (Ladybug+ recommended), let Gradle sync, then Build > Build APK(s).
The environment used to prepare this package does not include the Android SDK, so the APK itself is not compiled here.
