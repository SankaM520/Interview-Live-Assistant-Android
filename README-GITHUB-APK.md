# GitHub APK build

This project is configured for GitHub Actions.

1. Upload the contents of this project to your repository, keeping `.github/workflows/build-apk.yml` at the repository root.
2. Open **Actions** → **Build APK** → **Run workflow**.
3. After the run succeeds, open the run summary and download the **interview-assistant-apk** artifact.

The workflow builds the nested `InterviewAssistantAndroid` Gradle project with JDK 17 and Gradle 8.9. Gradle 8.9 is required by Android Gradle Plugin 8.7.x.
