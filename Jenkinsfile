// Pipeline CI/CD : tests -> build Docker -> scan Trivy -> smoke test -> push Docker Hub
pipeline {
    agent any

    environment {
        IMAGE_NAME = 'mayssadhahri1/snake-arena'
        IMAGE_TAG  = "${env.BUILD_NUMBER}"
        // Identifiants Docker Hub enregistrés dans Jenkins (Manage Credentials)
        DOCKERHUB  = credentials('dockerhub-credentials')
    }

    options {
        timestamps()
        timeout(time: 20, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '10'))
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install & Test') {
            // Les tests tournent dans un conteneur Node : rien à installer sur l'agent
            agent {
                docker { image 'node:20-alpine'; reuseNode true }
            }
            steps {
                sh 'npm install --no-audit --no-fund'
                sh 'npm test'
            }
        }

        stage('Build image') {
            steps {
                sh 'docker build -t $IMAGE_NAME:$IMAGE_TAG -t $IMAGE_NAME:latest .'
            }
        }

        stage('Scan Trivy') {
            steps {
                // Le build échoue si une faille CRITICAL corrigeable est trouvée
                sh '''
                  docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
                    aquasec/trivy:latest image --exit-code 1 --severity CRITICAL \
                    --ignore-unfixed $IMAGE_NAME:$IMAGE_TAG
                '''
            }
        }

        stage('Smoke test') {
            steps {
                sh '''
                  docker rm -f snake-smoke || true
                  docker run -d --name snake-smoke -p 3099:3000 $IMAGE_NAME:$IMAGE_TAG
                  for i in $(seq 1 10); do
                    curl -fs http://localhost:3099/api/health && exit 0
                    sleep 2
                  done
                  echo "Le conteneur ne répond pas" && exit 1
                '''
            }
            post {
                always { sh 'docker rm -f snake-smoke || true' }
            }
        }

        stage('Push Docker Hub') {
            when { branch 'main' }
            steps {
                sh 'echo $DOCKERHUB_PSW | docker login -u $DOCKERHUB_USR --password-stdin'
                sh 'docker push $IMAGE_NAME:$IMAGE_TAG'
                sh 'docker push $IMAGE_NAME:latest'
            }
        }
    }

    post {
        always {
            sh 'docker logout || true'
        }
        success {
            echo "Build ${env.BUILD_NUMBER} réussi : image ${env.IMAGE_NAME}:${env.IMAGE_TAG}"
        }
        failure {
            echo 'Le pipeline a échoué, voir les logs ci-dessus.'
        }
    }
}
