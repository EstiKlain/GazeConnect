// environment.production.ts — ערכים לסביבת Docker/Production
// כשמשנים את כתובת ה-API Gateway — משנים רק כאן
export const environment = {
  production: true,
  apiUrls: {
    aacBoard:    'http://localhost:5000/api/aac',   // דרך API Gateway
    cameraHub:   'http://localhost:5000/api/camera',
    userProfile: 'http://localhost:5000/api/users',
    tts:         'http://localhost:5000/api/tts',
  }
};