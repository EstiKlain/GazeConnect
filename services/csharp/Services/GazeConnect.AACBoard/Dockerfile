# ── שלב 1: Build ──────────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# העתק את כל ה-.csproj קודם (cache layer לשחזור מהיר)
COPY ["Services/GazeConnect.AACBoard/GazeConnect.AACBoard.Api/GazeConnect.AACBoard.Api.csproj",       "Services/GazeConnect.AACBoard/GazeConnect.AACBoard.Api/"]
COPY ["Services/GazeConnect.AACBoard/GazeConnect.AACBoard.Core/GazeConnect.AACBoard.Core.csproj",     "Services/GazeConnect.AACBoard/GazeConnect.AACBoard.Core/"]
COPY ["Services/GazeConnect.AACBoard/GazeConnect.AACBoard.Data/GazeConnect.AACBoard.Data.csproj",     "Services/GazeConnect.AACBoard/GazeConnect.AACBoard.Data/"]
COPY ["Services/GazeConnect.AACBoard/GazeConnect.AACBoard.Service/GazeConnect.AACBoard.Service.csproj", "Services/GazeConnect.AACBoard/GazeConnect.AACBoard.Service/"]

# RUN find /src -name "NuGet.Config" -delete

# # Restore NuGet packages
# RUN dotnet restore "Services/GazeConnect.AACBoard/GazeConnect.AACBoard.Api/GazeConnect.AACBoard.Api.csproj"

RUN find /src -name "NuGet.Config" -delete
RUN find /src -name "*.nuget.g.props" -delete && \
    find /src -name "*.nuget.g.targets" -delete && \
    dotnet restore "Services/GazeConnect.AACBoard/GazeConnect.AACBoard.Api/GazeConnect.AACBoard.Api.csproj" \
    /p:RestoreForceEvaluate=true

# העתק את כל שאר קבצי המקור
COPY . .

# Build + Publish
RUN dotnet publish "Services/GazeConnect.AACBoard/GazeConnect.AACBoard.Api/GazeConnect.AACBoard.Api.csproj" \
    -c Release -o /app/publish 
    # --no-restore

# ── שלב 2: Runtime ────────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

# העתק את הפלט מ-Build
COPY --from=build /app/publish .

# הגדרות סביבה
ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production

EXPOSE 8080

ENTRYPOINT ["dotnet", "GazeConnect.AACBoard.Api.dll"]