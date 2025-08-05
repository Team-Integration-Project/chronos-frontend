
# ⏱️ Chronos Frontend

> A smart facial recognition time tracking system for construction teams and remote workers.  
> Built with **React Native** and **Expo**.

---

## 📚 Table of Contents

- [🔍 Overview](#overview)  
- [🚀 Features](#features)  
- [🛠️ Tech Stack](#tech-stack)  
- [⚙️ Requirements](#requirements)  
- [📦 Installation & Running](#installation--running)  
- [📁 Project Structure](#project-structure)  
- [🖼️ Main Screens](#main-screens)  
- [🎨 Customization](#customization)  
- [🤝 Contributing](#contributing)  
- [📞 Support & Contact](#support--contact)  
- [📄 License](#license)

---

## 🔍 Overview

Chronos is a mobile time tracking app that uses facial recognition to register attendance.  
It’s designed for use in environments like construction sites or field teams, offering features like:

- ✅ Secure clock-in/out with camera  
- ✅ Submission and approval of absence justifications  
- ✅ Attendance reports  
- ✅ User profile management  
- ✅ Integrated help center  

---

## 🚀 Features

- **📷 Facial Recognition Clock-In**  
  Employees log work time using their device's front camera.

- **📝 Justification Workflow**  
  Absences can be submitted and reviewed by a manager.

- **📊 Attendance Reports**  
  View daily, monthly, and per-user data.

- **👤 User Profile**  
  Employees can view and edit their own data.

- **❓ Help Center**  
  Access FAQs and get support directly from the app.

---

## 🛠️ Tech Stack

| Technology      | Description                       |
|-----------------|-----------------------------------|
| ⚛️ React Native  | Mobile development framework      |
| 🚀 Expo          | Toolchain for RN development      |
| 🧠 TypeScript    | Safer and scalable JavaScript     |
| 🧭 Expo Router   | Declarative navigation            |
| 💠 Ionicons      | Icon library                      |

---

## ⚙️ Requirements

To run this project, you need:

- **[Node.js](https://nodejs.org/)** (v18+ recommended)
- **npm** or **Yarn**
- A **mobile device** with [Expo Go](https://expo.dev/client) installed  
- Alternatively, use an **Android/iOS emulator**

> ✅ You do **not** need to install `expo-cli`.

---

## 📦 Installation & Running

Follow these steps:

```bash
# 1. Clone the repository
git clone https://github.com/your-username/chrono-frontend.git

# 2. Navigate to the project folder (if necessary)
cd chrono-frontend

# 3. Install dependencies
npm install

# 4. Start the development server
npm start
````

* Then open **Expo Go** on your phone and scan the QR code that appears in the terminal.

---

## 📁 Project Structure

```bash
chronos/
├── src/
│   ├── app/
│   │   ├── auth/                    # Telas de autenticação (authentication screens)
│   │   ├── help/                    # Central de ajuda (help center)
│   │   ├── manager/                 # Fluxo do Chefe de Obra (manager flow)
│   │   │   ├── home/                # Home do manager (manager home)
│   │   │   ├── reports/             # Relatórios de funcionários (employee reports)
│   │   │   ├── manager-justifications/ # Justificativas recebidas (received justifications)
│   │   │   ├── profile/             # Perfil do manager (manager profile)
│   │   │   └── clock-in/            # Reconhecimento facial para ponto (clock-in facial recognition)
│   │   ├── worker/                  # Fluxo do Terceirizado (worker flow)
│   │   │   ├── home/                # Home do worker (worker home)
│   │   │   ├── reports/             # Relatório pessoal do worker (worker personal report)
│   │   │   ├── justifications/      # Envio de justificativas (send justifications)
│   │   │   └── profile/             # Perfil do worker (worker profile)
│   │   └── index.tsx                # Tela de login (login screen)
│   ├── components/
│   │   ├── ButtonLogin/             # Botão de login/ação (login/action button)
│   │   ├── Help/                    # Componentes de ajuda (help components)
│   │   ├── FacialRecognitionRegister/ # Reconhecimento facial para cadastro (facial recognition for registration)
│   │   └── FacialRecognitionClockIn/  # Reconhecimento facial para ponto (facial recognition for clock-in)
│   └── assets/
│       ├── images/                  # Imagens e ícones (images and icons)
│       └── fonts/                   # Fontes customizadas (custom fonts)
├── package.json
├── app.json
├── tsconfig.json
└── babel.config.js
```

---

## 🖼️ Main Screens

| Screen                | Description                              |
| --------------------- | ---------------------------------------- |
| 🏠 **Home**           | Entry point with navigation              |
| 📷 **Clock In**       | Camera-based facial recognition system   |
| 📝 **Justifications** | Send or review justification requests    |
| 📊 **Reports**        | Display user and team attendance records |
| 👤 **Profile**        | User can edit their own information      |
| ❓ **Help**            | Browse FAQ and contact technical support |

---

## 🎨 Customization

* 🎨 **Styles and Colors:** Located in each screen or component file
* 💡 **Icons:** Provided by [Ionicons](https://ionic.io/ionicons)
* 🔄 **Data Integration:** Replace mock data with backend API calls

---

## 🤝 Contributing

If you'd like to contribute:

```bash
# 1. Fork the repository
# 2. Create a feature branch
git checkout -b feat/my-feature

# 3. Make your changes and commit
git commit -m "feat: my awesome feature"

# 4. Push and open a pull request
git push origin feat/my-feature
```

---

## 📞 Support & Contact

For help, suggestions, or bug reports:

* 📧 Email: [suporte@chronos.com.br](mailto:suporte@chronos.com.br)
* 📱 WhatsApp: [+55 (11) 99999-9999](https://wa.me/5511999999999)

---

## 📄 License

This project is licensed under the **MIT License**.
See the [LICENSE](./LICENSE) file for full details.

