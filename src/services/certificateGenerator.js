import html2canvas from 'html2canvas';

const waitForFonts = () => {
    return new Promise((resolve) => {
        // Check if Inter font is already loaded
        if (document.fonts?.check('1em Inter')) {
            resolve();
        } else {
            // Wait for fonts to load
            document.fonts?.ready?.then(resolve);
            // Fallback timeout
            setTimeout(resolve, 1000);
        }
    });
};

export const generateCertificateImage = async (profile, course, account) => {
    return new Promise(async (resolve, reject) => {
        try {
            // Handle both string address and account object
            const accountAddress = typeof account === 'string' ? account : account?.address;

            if (!accountAddress) {
                throw new Error('Account address is required');
            }

            // Generate the HTML content
            const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <title>Certificate of Completion - ${course.courseName}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body { 
            font-family: 'Inter', sans-serif; 
            margin: 0; 
            padding: 0; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
        }
        
        .certificate-container {
            background: white;
            width: 1200px;
            height: 800px;
            margin: 20px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            border: 20px solid transparent;
            border-image: linear-gradient(45deg, #d4af37, #ffd700, #d4af37) 1;
            position: relative;
        }
        
        .certificate-content {
            padding: 80px 60px;
            height: 100%;
            display: flex;
            flex-direction: column;
            justify-content: center;
            text-align: center;
            position: relative;
        }
        
        .watermark {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            font-size: 100px;
            font-weight: bold;
            color: rgba(0, 0, 0, 0.03);
            z-index: 0;
            white-space: nowrap;
            pointer-events: none;
        }
        
        .header { 
            color: #1e40af; 
            font-size: 42px; 
            font-weight: 700; 
            margin-bottom: 20px;
            letter-spacing: 3px;
            text-transform: uppercase;
        }
        
        .subtitle {
            color: #6b7280;
            font-size: 18px;
            margin-bottom: 40px;
            font-weight: 300;
        }
        
        .student-name { 
            font-size: 48px; 
            font-weight: bold; 
            margin: 40px 0; 
            color: #1f2937;
            background: linear-gradient(135deg, #1e40af, #3730a3);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        
        .achievement-text {
            font-size: 20px;
            color: #4b5563;
            margin: 20px 0;
            line-height: 1.6;
        }
        
        .course-title { 
            font-size: 32px; 
            color: #1e40af;
            font-weight: 600;
            margin: 30px 0;
        }
        
        .details-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            margin: 50px 0;
            text-align: left;
        }
        
        .detail-section h4 {
            font-size: 16px;
            color: #374151;
            margin-bottom: 15px;
            font-weight: 600;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 8px;
        }
        
        .detail-item {
            margin: 12px 0;
            font-size: 14px;
            color: #6b7280;
        }
        
        .detail-item strong {
            color: #374151;
            font-weight: 600;
        }
        
        .badge {
            display: inline-block;
            background: linear-gradient(135deg, #10b981, #059669);
            color: white;
            padding: 10px 20px;
            border-radius: 25px;
            font-size: 16px;
            font-weight: 600;
            margin: 20px 0;
        }
        
        .signatures {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            margin-top: 60px;
            padding-top: 40px;
            border-top: 2px solid #e5e7eb;
        }
        
        .signature-line {
            border-bottom: 2px solid #9ca3af;
            width: 200px;
            margin: 0 auto 10px auto;
        }
        
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 12px;
            color: #9ca3af;
        }
        
        .seal {
            position: absolute;
            top: 30px;
            right: 30px;
            width: 100px;
            height: 100px;
            background: linear-gradient(135deg, #f59e0b, #d97706);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 14px;
            text-align: center;
            padding: 15px;
            box-shadow: 0 8px 20px rgba(245, 158, 11, 0.4);
        }
    </style>
</head>
<body>
    <div class="certificate-container">
        <div class="seal">BLOCKCHAIN VERIFIED</div>
        <div class="watermark">CODEPINNACLE</div>
        <div class="certificate-content">
            <div class="header">Certificate of Completion</div>
            <div class="subtitle">This is to certify that</div>
            
            <div class="student-name">${profile.fname} ${profile.lname}</div>
            
            <div class="achievement-text">
                has successfully completed all requirements and demonstrated exceptional proficiency in
            </div>
            
            <div class="course-title">${course.courseName}</div>
            
            <div class="badge">Blockchain Verified Certificate</div>
            
            <div class="details-grid">
                <div class="detail-section">
                    <h4>Course Details</h4>
                    <div class="detail-item">
                        <strong>Certificate ID:</strong> #${Date.now().toString().slice(-8)}
                    </div>
                    <div class="detail-item">
                        <strong>Course ID:</strong> #${course.id}
                    </div>
                    <div class="detail-item">
                        <strong>Level:</strong> ${course.difficulty_level}
                    </div>
                    <div class="detail-item">
                        <strong>Enrollment Date:</strong> ${new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            })}
                    </div>
                </div>
                
                <div class="detail-section">
                    <h4>Issuance Details</h4>
                    <div class="detail-item">
                        <strong>Date Issued:</strong> ${new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            })}
                    </div>
                    <div class="detail-item">
                        <strong>Student ID:</strong> ${accountAddress.substring(0, 10)}...${accountAddress.substring(accountAddress.length - 6)}
                    </div>
                    <div class="detail-item">
                        <strong>Instructor:</strong> Platform Director
                    </div>
                    <div class="detail-item">
                        <strong>Status:</strong> <span style="color: #10b981; font-weight: 600;">Verified & Permanent</span>
                    </div>
                </div>
            </div>
            
            <div class="signatures">
                <div class="signature-section">
                    <div class="signature-line"></div>
                    <div style="font-weight: 600; color: #374151; margin-top: 8px;">Platform Director</div>
                    <div style="font-size: 14px; color: #6b7280;">CodePinnacle Academy</div>
                </div>
                
                <div class="signature-section">
                    <div class="signature-line"></div>
                    <div style="font-weight: 600; color: #374151; margin-top: 8px;">Blockchain Seal</div>
                    <div style="font-size: 14px; color: #6b7280;">Immutable Record</div>
                </div>
            </div>
            
            <div class="footer">
                <div>Issued by CodePinnacle Academy • This certificate is permanently recorded on the blockchain</div>
                <div>Verification ID: ${Date.now().toString().slice(-12)} • ${new Date().getFullYear()}</div>
            </div>
        </div>
    </div>
</body>
</html>`;

            // Create a temporary container
            const container = document.createElement('div');
            container.style.position = 'absolute';
            container.style.left = '-9999px';
            container.style.top = '-9999px';
            container.style.width = '1200px';
            container.style.height = '800px';
            container.innerHTML = htmlContent;

            document.body.appendChild(container);

            // Wait for fonts and images to load
            await Promise.all([
                waitForFonts(),
                new Promise(resolve => setTimeout(resolve, 500))
            ]);

            // Convert to canvas
            const canvas = await html2canvas(container, {
                scale: 2, // Higher resolution
                useCORS: true,
                allowTaint: false,
                backgroundColor: '#ffffff',
                width: 1200,
                height: 800,
                logging: false,
                onclone: (clonedDoc) => {
                    // Ensure fonts are loaded in cloned document
                    const style = clonedDoc.createElement('style');
                    style.textContent = `
                        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
                    `;
                    clonedDoc.head.appendChild(style);
                }
            });

            // Convert to blob
            canvas.toBlob((blob) => {
                document.body.removeChild(container);

                if (blob) {
                    const file = new File([blob], `certificate-${course.id}-${account.address}.png`, {
                        type: 'image/png'
                    });
                    resolve(file);
                } else {
                    reject(new Error('Failed to create image blob'));
                }
            }, 'image/png', 0.95);

        } catch (error) {
            console.error('Error generating certificate image:', error);
            reject(error);
        }
    });
};

export const generateCertificateHTML = (profile, course, account) => {
    // Handle both string address and account object
    const accountAddress = typeof account === 'string' ? account : account?.address;

    return `
<!DOCTYPE html>
<html>
<head>
    <title>Certificate of Completion - ${course.courseName}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 40px; background: #f8f9fa; }
        .certificate { background: white; border: 8px solid #2563eb; padding: 60px; text-align: center; max-width: 800px; margin: 0 auto; }
        .header { color: #2563eb; font-size: 36px; font-weight: bold; margin-bottom: 20px; }
        .student-name { font-size: 32px; font-weight: bold; margin: 30px 0; color: #1f2937; }
        .course-title { font-size: 24px; color: #4b5563; margin: 20px 0; }
        .details { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 40px 0; text-align: left; }
        .detail-item { margin: 10px 0; }
        .issued-date { color: #6b7280; margin-top: 40px; }
    </style>
</head>
<body>
    <div class="certificate">
        <div class="header">CERTIFICATE OF COMPLETION</div>
        <p>This is to certify that</p>
        <div class="student-name">${profile.fname} ${profile.lname}</div>
        <p>has successfully completed the course</p>
        <div class="course-title">${course.courseName}</div>
        <div class="details">
            <div>
                <div class="detail-item"><strong>Certificate ID:</strong> #${Date.now()}</div>
                <div class="detail-item"><strong>Course ID:</strong> #${course.id}</div>
                <div class="detail-item"><strong>Level:</strong> ${course.difficulty_level}</div>
            </div>
            <div>
                <div class="detail-item"><strong>Student Address:</strong> ${accountAddress ? accountAddress.substring(0, 8) + '...' : 'N/A'}</div>
                <div class="detail-item"><strong>Issued On:</strong> ${new Date().toLocaleDateString()}</div>
                <div class="detail-item"><strong>Status:</strong> Verified</div>
            </div>
        </div>
        <div class="issued-date">Issued by CodePinnacle Academy - Blockchain Verified</div>
    </div>
</body>
</html>`;
};