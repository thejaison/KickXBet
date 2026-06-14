# Step 1: Build using a definitive JDK 26 variant
FROM eclipse-temurin:26-jdk AS build
COPY . .

# Grant execute permission to the maven wrapper and build the package
RUN chmod +x ./mvnw
RUN ./mvnw clean package -DskipTests

# Step 2: Run the application using the matching Java 26 runtime
FROM eclipse-temurin:26-jre
COPY --from=build /target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java","-jar","app.jar"]