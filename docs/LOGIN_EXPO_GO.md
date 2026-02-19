# How to log in on Expo Go

If you enter the **correct email and password** but still cannot log in, the app is almost certainly **not reaching your Laravel API**. Expo Go runs on your phone or simulator; the app uses `EXPO_PUBLIC_API_BASE_URL` to call the backend.

## 1. Set the API URL for your device

- **Default** (in code): `http://localhost:8000`  
  - On a **physical device**, `localhost` is the phone itself, so the request never hits your computer → login fails.

Create or edit **`.env`** in the app root (same folder as `package.json`):

```env
# Use your computer’s IP so the phone/simulator can reach the Laravel server.
# Replace with your PC’s LAN IP (e.g. from ipconfig on Windows, or ifconfig / Network settings on Mac).
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.XXX:8000
```

- **iOS Simulator**: often `http://localhost:8000` works.
- **Android Emulator**: use `http://10.0.2.2:8000` to reach the host machine.
- **Physical device (phone/tablet)**: use your PC’s IP, e.g. `http://192.168.1.100:8000`.

No trailing slash. Restart Expo after changing `.env` (`npx expo start --clear`).

## 2. Run Laravel so it accepts connections from the app

Start the backend so it listens on all interfaces (not only localhost):

```bash
cd path/to/webDaiHocVN73
php artisan serve --host=0.0.0.0 --port=8000
```

Then the server is reachable at `http://<your-pc-ip>:8000`.

## 3. Same network

Phone and computer must be on the **same Wi‑Fi** (or network) so the device can reach `http://<your-pc-ip>:8000`.

## 4. Check backend is reachable

- On the **computer**: open a browser and go to `http://localhost:8000/api/v1/ping`. You should see `{"ok":true}`.
- On the **phone**: open a browser and go to `http://<your-pc-ip>:8000/api/v1/ping`. If that fails, the phone cannot reach the server (firewall, wrong IP, or different network).

## 5. Credentials

- Use an email/password that exists in the Laravel database (same app that the API runs on).
- Register first via the app or via the web if needed, then log in with that email and password.

---

**Summary:** Set `EXPO_PUBLIC_API_BASE_URL` in `.env` to the URL where your Laravel API is reachable from the device (e.g. `http://YOUR_PC_IP:8000`), run Laravel with `php artisan serve --host=0.0.0.0`, and ensure the device and PC are on the same network. Then try logging in again.
