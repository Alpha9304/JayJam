pipeline {
    agent any
    
    environment {
        RESEND_API_KEY = credentials('RESEND_API_KEY')
        // NODE_ENV = credentials('NODE_ENV')
       
    //    BRANCH = "${env.BRANCH_NAME ?: 'master'}"
        BRANCH = "${env.GIT_BRANCH?.tokenize('/')?.last() ?: 'master'}"

 
        // Branch-specific environment variables
        FRONTEND_PORT = "${BRANCH == 'master' ? '3000' : '3002'}"
        BACKEND_PORT = "${BRANCH == 'master' ? '4000' : '4002'}"
        FRONTEND_URL = "${BRANCH == 'master' ? 'http://localhost:3000' : 'http://localhost:3002'}"
        BACKEND_URL = "${BRANCH == 'master' ? 'http://localhost:4000' : 'http://localhost:4002'}"
        NEXT_PUBLIC_BACKEND_URL = "${BRANCH == 'master' ? 'https://team03.crabdance.com/api'  : 'https://dev.team03.crabdance.com/api'}"
        NEXT_PUBLIC_FRONTEND_URL = "${BRANCH == 'master' ? 'https://team03.crabdance.com' : 'https://dev.team03.crabdance.com'}"
        NEXT_PUBLIC_FRONTEND_FALLBACK_URL = "${BRANCH == 'master' ? 'https://team03.hopto.org' : ''}"
        NEXT_PUBLIC_BACKEND_FALLBACK_URL = "${BRANCH == 'master' ? 'https://team03.hopto.org/api' : ''}"
        // Branch-specific PM2 app names
        FRONTEND_APP_NAME = "${BRANCH == 'master' ? 'frontend-prod' : 'frontend-dev'}"
        BACKEND_APP_NAME = "${BRANCH == 'master' ? 'backend-prod' : 'backend-dev'}"
        
        PATH="/var/lib/jenkins/.local/share/pnpm/:${env.PATH}"
        // NODE_PATH="/var/lib/jenkins/.local/share/pnpm/:${env.PATH}"
    }

    stages {
        stage('pull from repo') {
            steps {
                checkout scm
            }
        }
        
        stage('build') {
            steps {
                // build command
                sh '''
                pnpm -v
                node -v

                pnpm clean
                pnpm install --force
                pnpm build
                '''
            }
        }

        
        stage('deploy') {
            steps {
                script {
                    sh '''
                    pm2 stop ${FRONTEND_APP_NAME} || true
                    pm2 stop ${BACKEND_APP_NAME} || true
                    pm2 delete ${FRONTEND_APP_NAME} || true
                    pm2 delete ${BACKEND_APP_NAME} || true
                    '''

                    if (BRANCH == 'master') {
                        sh '''
                        ENV="production" FRONTEND_PORT=${FRONTEND_PORT} BACKEND_PORT=${BACKEND_PORT} pm2 start ecosystem.config.js --env production
                        '''
                    } else {
                        sh '''
                        ENV="development" FRONTEND_PORT=${FRONTEND_PORT} BACKEND_PORT=${BACKEND_PORT} pm2 start ecosystem.config.js --env development 
                        '''
                    }
                }
            }
        }
    }
    
    post {
        success {
            echo "Successfully deployed ${BRANCH} branch!"
        }
        failure {
            echo "Failed to deploy ${BRANCH} branch!"
        }
        // Clean after build
        always {
            cleanWs(cleanWhenNotBuilt: false,
                    deleteDirs: true,
                    disableDeferredWipeout: true,
                    notFailBuild: true,
                    patterns: [
                        [pattern: '.gitignore', type: 'INCLUDE'],
                        [pattern: '.propsfile', type: 'EXCLUDE']
                    ])
        }
    }
}