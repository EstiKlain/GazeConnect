# # ── שלב 1: Build ─────────────────────────────────────────────
# # SDK image כולל את כל כלי הפיתוח לקומפילציה
# FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
# WORKDIR /src

# # מעתיק את ה-.csproj קודם — Docker cache: אם לא השתנה, לא מריץ restore מחדש
# COPY ["Services/GazeConnect.CameraHub/GazeConnect.CameraHub.Api/GazeConnect.CameraHub.Api.csproj", "Services/GazeConnect.CameraHub/GazeConnect.CameraHub.Api/"]
# COPY ["Services/GazeConnect.CameraHub/GazeConnect.CameraHub.Core/GazeConnect.CameraHub.Core.csproj", "Services/GazeConnect.CameraHub/GazeConnect.CameraHub.Core/"]
# COPY ["Services/GazeConnect.CameraHub/GazeConnect.CameraHub.Service/GazeConnect.CameraHub.Service.csproj", "Services/GazeConnect.CameraHub/GazeConnect.CameraHub.Service/"]
# COPY ["Shared/GazeConnect.Shared/GazeConnect.Shared.csproj", "Shared/GazeConnect.Shared/"]

# RUN dotnet restore "Services/GazeConnect.CameraHub/GazeConnect.CameraHub.Api/GazeConnect.CameraHub.Api.csproj"

# # עכשיו מעתיק את כל הקוד ובונה
# COPY . .
# RUN dotnet publish "Services/GazeConnect.CameraHub/GazeConnect.CameraHub.Api/GazeConnect.CameraHub.Api.csproj" \
#     -c Release -o /app/publish

# # ── שלב 2: Runtime ───────────────────────────────────────────
# # aspnet image קטן יותר — רק runtime, ללא SDK
# FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final

# # התקנת OpenCV dependencies (נדרש ל-OpenCvSharp)
# RUN apt-get update && apt-get install -y \
#     libopencv-dev \
#     libtesseract-dev \
#     libatlas-base-dev \
#     libgdiplus \
#     libx11-6 \
#     libc6-dev \
#     libfontconfig1 \
#     libice6 \
#     libsm6 \
#     libxt6 \
#     libxrender1 \
#     libxext6 \
#     && rm -rf /var/lib/apt/lists/*

# RUN ln -s /usr/lib/x86_64-linux-gnu/libtesseract.so /usr/lib/x86_64-linux-gnu/libtesseract.so.4

# WORKDIR /app
# COPY --from=build /app/publish .

# EXPOSE 8080
# ENTRYPOINT ["dotnet", "GazeConnect.CameraHub.Api.dll"]


FROM mcr.microsoft.com/dotnet/sdk:8.0-jammy AS build
WORKDIR /src

COPY ["Services/GazeConnect.CameraHub/GazeConnect.CameraHub.Api/GazeConnect.CameraHub.Api.csproj", "Services/GazeConnect.CameraHub/GazeConnect.CameraHub.Api/"]
COPY ["Services/GazeConnect.CameraHub/GazeConnect.CameraHub.Core/GazeConnect.CameraHub.Core.csproj", "Services/GazeConnect.CameraHub/GazeConnect.CameraHub.Core/"]
COPY ["Services/GazeConnect.CameraHub/GazeConnect.CameraHub.Service/GazeConnect.CameraHub.Service.csproj", "Services/GazeConnect.CameraHub/GazeConnect.CameraHub.Service/"]
COPY ["Shared/GazeConnect.Shared/GazeConnect.Shared.csproj", "Shared/GazeConnect.Shared/"]

RUN dotnet restore "Services/GazeConnect.CameraHub/GazeConnect.CameraHub.Api/GazeConnect.CameraHub.Api.csproj" \
    --runtime linux-x64

COPY . .
RUN dotnet publish "Services/GazeConnect.CameraHub/GazeConnect.CameraHub.Api/GazeConnect.CameraHub.Api.csproj" \
    -c Release -o /app/publish \
    --runtime linux-x64 \
    --self-contained false

FROM mcr.microsoft.com/dotnet/aspnet:8.0-jammy AS final

RUN apt-get update && apt-get install -y \
    libopencv-dev \
    libtesseract-dev \
    libatlas-base-dev \
    libgdiplus \
    libx11-6 \
    libc6-dev \
    libfontconfig1 \
    libice6 \
    libsm6 \
    libxt6 \
    libxrender1 \
    libxext6 \
    libgtk2.0-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --from=build /app/publish .

RUN cp /app/libOpenCvSharpExtern.so /usr/lib/ && ldconfig

EXPOSE 8080
ENTRYPOINT ["dotnet", "GazeConnect.CameraHub.Api.dll"]