FROM maven:3.9.11-eclipse-temurin-21 AS build
WORKDIR /work
COPY pom.xml ./
COPY src ./src
RUN mvn -B -ntp package

FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /work/target/checkout-lab-1.0.0.jar app.jar
USER 10001
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
