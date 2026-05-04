# # ──────────────────────────────────────────────────────────────
# # Dockerfile — Face Recognition Service
# #
# # מטרה: בונה image של Docker שמכיל את כל מה שהשירות צריך.
# # Docker קורא קובץ זה שורה-שורה ובונה "שכבות".
# # כל שכבה נשמרת במטמון — בניות חוזרות מהירות יותר.
# # ──────────────────────────────────────────────────────────────

# # Python 3.11 על Debian Slim — קטן וקל
# FROM python:3.11-slim

# # מונע שאלות אינטראקטיביות במהלך התקנות
# ENV DEBIAN_FRONTEND=noninteractive

# # ספריות מערכת הדרושות לOpenCV ולInsightFace
# RUN apt-get update && apt-get install -y \
#     libgl1  \
#     libglib2.0-0 \
#     libsm6 \
#     libxext6 \
#     libxrender-dev \
#     libgomp1 \
#     curl \
#     && rm -rf /var/lib/apt/lists/*

# # תיקיית עבודה בתוך ה-container
# WORKDIR /app

# # מעתיק קודם רק את requirements.txt
# # כך Docker ישתמש במטמון אם הקוד השתנה אבל לא ה-dependencies
# COPY requirements.txt .

# # מתקין את כל ספריות Python
# # --no-cache-dir = לא שומר cache של pip (מקטין גודל image)
# RUN pip install --no-cache-dir \
#     fastapi==0.111.0 \
#     uvicorn[standard]==0.29.0 \
#     asyncpg==0.29.0 \
#     pgvector==0.2.5 \
#     "sqlalchemy[asyncio]==2.0.30" \
#     "redis[hiredis]==5.0.4" \
#     python-multipart==0.0.9 \
#     pydantic==2.7.1 \
#     pydantic-settings==2.3.0 \
#     httpx==0.27.0 \
#     numpy==1.26.4 \
#     opencv-python-headless==4.9.0.80 \
#     onnxruntime==1.18.0 \
#     insightface==0.7.3

# # InsightFace מוריד את המודל בפעם הראשונה שהוא רץ.
# # אנחנו עושים זאת בזמן build — כדי שה-container יהיה מוכן מיד
# # ולא יצטרך לחכות להורדה של ~100MB בכל הפעלה
# RUN python -c "\
# import insightface; \
# from insightface.app import FaceAnalysis; \
# app = FaceAnalysis(name='buffalo_sc'); \
# app.prepare(ctx_id=-1)"

# # יוצר תיקייה לשמירת תמונות (volume יחבר לכאן)
# RUN mkdir -p /app/photos

# # מעתיק את כל קוד האפליקציה
# COPY ./app ./app

# # פורט שהשירות מאזין עליו
# EXPOSE 8001

# # הפקודה שרצה כשה-container עולה
# # --host 0.0.0.0 = מאזין לכל חיבורים (חשוב בDocker!)
# CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001", "--workers", "1"]


# ──────────────────────────────────────────────────────────────
# Dockerfile — Face Recognition Service
# ──────────────────────────────────────────────────────────────

# ──────────────────────────────────────────────────────────────
# Dockerfile — Face Recognition Service
# המודל buffalo_sc נמצא מקומית — לא מוריד מהאינטרנט!
# ──────────────────────────────────────────────────────────────

FROM python:3.11-slim

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    curl \
    ca-certificates \
    build-essential \
    g++ \
    unzip \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .

RUN pip install --no-cache-dir \
    --trusted-host pypi.org \
    --trusted-host pypi.python.org \
    --trusted-host files.pythonhosted.org \
    fastapi==0.111.0 \
    "uvicorn[standard]==0.29.0" \
    asyncpg==0.29.0 \
    pgvector==0.2.5 \
    "sqlalchemy[asyncio]==2.0.30" \
    "redis[hiredis]==5.0.4" \
    python-multipart==0.0.9 \
    pydantic==2.7.1 \
    pydantic-settings==2.3.0 \
    httpx==0.27.0 \
    numpy==1.26.4 \
    opencv-python-headless==4.9.0.80 \
    onnxruntime==1.18.0 \
    insightface==0.7.3

# העתקת המודל מהמחשב המקומי — לא מוריד מהאינטרנט!
# buffalo_sc.zip צריך להיות ב: models/buffalo_sc.zip
RUN mkdir -p /root/.insightface/models
COPY models/buffalo_sc.zip /root/.insightface/models/buffalo_sc.zip
RUN cd /root/.insightface/models && unzip buffalo_sc.zip -d buffalo_sc && rm buffalo_sc.zip
RUN mkdir -p /app/photos

COPY ./app ./app

EXPOSE 8001

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001", "--workers", "1"]