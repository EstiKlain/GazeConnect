# ── שלב 1: Build ─────────────────────────────────────────────
# SDK image כולל את כל כלי הפיתוח לקומפילציה
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# מעתיק את ה-.csproj קודם — Docker cache: אם לא השתנה, לא מריץ restore מחדש
COPY ["GazeConnect.CameraHub.Api/GazeConnect.CameraHub.Api.csproj", "GazeConnect.CameraHub.Api/"]
COPY ["GazeConnect.CameraHub.Core/GazeConnect.CameraHub.Core.csproj", "GazeConnect.CameraHub.Core/"]
COPY ["GazeConnect.CameraHub.Service/GazeConnect.CameraHub.Service.csproj", "GazeConnect.CameraHub.Service/"]

RUN dotnet restore "GazeConnect.CameraHub.Api/GazeConnect.CameraHub.Api.csproj"

# עכשיו מעתיק את כל הקוד ובונה
COPY . .
RUN dotnet publish "GazeConnect.CameraHub.Api/GazeConnect.CameraHub.Api.csproj" \
    -c Release -o /app/publish

# ── שלב 2: Runtime ───────────────────────────────────────────
# aspnet image קטן יותר — רק runtime, ללא SDK
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final

# התקנת OpenCV dependencies (נדרש ל-OpenCvSharp)
RUN apt-get update && apt-get install -y \
    libopencv-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --from=build /app/publish .

EXPOSE 8080
ENTRYPOINT ["dotnet", "GazeConnect.CameraHub.Api.dll"]