# Firebase Studio / IDX dev environment
# Expo + React Native (Android) — FINAL FIX

{ pkgs, ... }: {
  channel = "stable-25.05";

  packages = [
    pkgs.nodejs_20
    pkgs.openjdk17
    pkgs.android-tools
    pkgs.yarn
  ];

  # Only safe env vars — NO PATH overrides
  env = {
    EXPO_USE_FAST_RESOLVER = 1;
    JAVA_HOME = "${pkgs.openjdk17.home}";
  };

  idx = {
    extensions = [
      "msjsdiag.vscode-react-native"
    ];

    workspace = {
      onCreate = {
        install = ''
          echo "Installing dependencies..."
          npm ci --prefer-offline --no-audit --no-progress --timing
          npm i @expo/ngrok@^4.1.0
          npm i react@latest react-dom@latest react-native@latest
          npm i -D @types/react@latest
        '';
      };

      onStart = {
        android = ''
          echo "Java version:"
          java -version

          echo "ANDROID_SDK_ROOT (IDX-managed):"
          echo $ANDROID_SDK_ROOT

          echo "Waiting for Android emulator..."
          adb -s emulator-5554 wait-for-device

          echo "Running Expo Android build..."
          npm run android -- 
        '';
      };
    };

    previews = {
      enable = true;

      previews = {
        web = {
          command = [ "npm" "run" "web" "--" "--port" "$PORT" ];
          manager = "web";
        };
        android = {
          command = [ "tail" "-f" "/dev/null" ];
          manager = "web";
        };
      };
    };
  };
}
