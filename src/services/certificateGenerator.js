// utils/certificateGenerator.js
import html2canvas from 'html2canvas';

const waitForFonts = () => {
    return new Promise((resolve) => {
        if (document.fonts?.check('1em Inter')) {
            resolve();
        } else {
            document.fonts?.ready?.then(resolve);
            setTimeout(resolve, 1500);
        }
    });
};

export const generateCertificateImage = async (profile, course, account) => {
    return new Promise(async (resolve, reject) => {
        try {
            const accountAddress = typeof account === 'string' ? account : account?.address;

            if (!accountAddress) {
                throw new Error('Account address is required');
            }

            const certificateId = `CERT-${Date.now().toString().slice(-8)}-${course.courseId}`;
            const issueDate = new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            // Get difficulty level text and gradient
            const getDifficultyText = (level) => {
                const num = Number(level);
                if (num === 0) return 'Beginner';
                if (num === 1) return 'Intermediate';
                if (num === 2) return 'Advanced';
                return 'Professional';
            };

            const getDifficultyGradient = (level) => {
                const num = Number(level);
                if (num === 2) return 'linear-gradient(135deg, #fbbf24, #d97706, #92400e)'; // Gold for advanced
                if (num === 1) return 'linear-gradient(135deg, #94a3b8, #64748b, #475569)'; // Silver for intermediate
                return 'linear-gradient(135deg, #cd7f32, #b45309, #854d0e)'; // Bronze for beginner
            };

            const difficultyText = getDifficultyText(course.difficulty_level);
            const borderGradient = getDifficultyGradient(course.difficulty_level);

            // Generate the HTML content - NFT-style portrait certificate
            const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <title>Certificate of Completion - ${course.courseName}</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body { 
            font-family: 'Inter', sans-serif; 
            margin: 0; 
            padding: 0; 
            background: transparent;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
        }
        
        .certificate-container {
            width: 800px;
            height: 1000px;
            background: white;
            border-radius: 24px;
            overflow: hidden;
            position: relative;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
            margin: 0;
        }
        
        /* Animated background pattern */
        .bg-pattern {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: radial-gradient(circle at 20% 30%, rgba(255, 215, 0, 0.03) 0%, transparent 30%),
                        radial-gradient(circle at 80% 70%, rgba(255, 215, 0, 0.03) 0%, transparent 30%);
            pointer-events: none;
        }
        
        /* Decorative border with gradient based on difficulty */
        .border-gradient {
            position: absolute;
            top: 20px;
            left: 20px;
            right: 20px;
            bottom: 20px;
            border: 3px solid transparent;
            border-radius: 16px;
            background: ${borderGradient} border-box;
            -webkit-mask: linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0);
            mask: linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0);
            -webkit-mask-composite: xor;
            mask-composite: exclude;
            pointer-events: none;
            opacity: 0.8;
        }
        
        /* Corner decorations */
        .corner {
            position: absolute;
            width: 80px;
            height: 80px;
            border: 3px solid #fbbf24;
            opacity: 0.3;
        }
        
        .corner-tl {
            top: 40px;
            left: 40px;
            border-right: none;
            border-bottom: none;
            border-radius: 16px 0 0 0;
        }
        
        .corner-tr {
            top: 40px;
            right: 40px;
            border-left: none;
            border-bottom: none;
            border-radius: 0 16px 0 0;
        }
        
        .corner-bl {
            bottom: 40px;
            left: 40px;
            border-right: none;
            border-top: none;
            border-radius: 0 0 0 16px;
        }
        
        .corner-br {
            bottom: 40px;
            right: 40px;
            border-left: none;
            border-top: none;
            border-radius: 0 0 16px 0;
        }
        
        .certificate-content {
            padding: 50px 60px;
            height: 100%;
            display: flex;
            flex-direction: column;
            position: relative;
            z-index: 2;
        }
        
        /* NFT Badge */
        .nft-badge {
            position: absolute;
            top: 40px;
            right: 40px;
            background: linear-gradient(135deg, #8b5cf6, #6366f1);
            padding: 8px 20px;
            border-radius: 40px;
            color: white;
            font-weight: 600;
            font-size: 14px;
            letter-spacing: 1px;
            box-shadow: 0 10px 20px rgba(99, 102, 241, 0.3);
            z-index: 10;
            display: flex;
            align-items: center;
            gap: 6px;
        }
        
        .nft-badge::before {
            content: "✦";
            font-size: 16px;
        }
        
        /* Main header */
        .header {
            text-align: center;
            margin-bottom: 20px;
            margin-top: 20px;
        }
        
        .header-top {
            font-size: 16px;
            font-weight: 500;
            color: #fbbf24;
            letter-spacing: 4px;
            text-transform: uppercase;
            margin-bottom: 10px;
        }
        
        .header-title {
            font-size: 52px;
            font-weight: 800;
            background: linear-gradient(135deg, #1e293b, #0f172a);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            line-height: 1.2;
        }
        
        .header-subtitle {
            font-size: 18px;
            color: #64748b;
            margin-top: 10px;
            font-weight: 300;
        }
        
        /* Recipient section */
        .recipient-section {
            text-align: center;
            margin: 15px 0 20px;
        }
        
        .recipient-name {
            font-size: 48px;
            font-weight: 800;
            background: linear-gradient(135deg, #fbbf24, #d97706);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            line-height: 1.2;
            margin-bottom: 15px;
            word-break: break-word;
        }
        
        .achievement-text {
            font-size: 18px;
            color: #334155;
            font-weight: 400;
            max-width: 600px;
            margin: 0 auto;
        }
        
        .course-name {
            font-size: 28px;
            font-weight: 700;
            color: #0f172a;
            margin: 20px 0;
            padding: 15px 25px;
            background: linear-gradient(135deg, #f8fafc, #f1f5f9);
            display: inline-block;
            border-radius: 60px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
            max-width: 90%;
            word-break: break-word;
        }
        
        /* Difficulty badge */
        .difficulty-badge {
            display: inline-block;
            padding: 8px 24px;
            background: ${Number(course.difficulty_level) === 2 ? 'linear-gradient(135deg, #fbbf24, #d97706)' :
                    Number(course.difficulty_level) === 1 ? 'linear-gradient(135deg, #94a3b8, #64748b)' :
                        'linear-gradient(135deg, #cd7f32, #b45309)'};
            color: white;
            font-weight: 600;
            font-size: 16px;
            border-radius: 40px;
            margin-bottom: 20px;
            box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
        }
        
        /* Details grid */
        .details-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin: 20px 0;
            background: #f8fafc;
            padding: 25px;
            border-radius: 20px;
            border: 1px solid #e2e8f0;
        }
        
        .detail-column h4 {
            font-size: 14px;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 15px;
        }
        
        .detail-item {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px dashed #e2e8f0;
        }
        
        .detail-item:last-child {
            border-bottom: none;
        }
        
        .detail-label {
            color: #64748b;
            font-size: 13px;
        }
        
        .detail-value {
            font-weight: 600;
            color: #0f172a;
            font-size: 13px;
            text-align: right;
            max-width: 60%;
            word-break: break-word;
        }
        
        .detail-value.highlight {
            background: linear-gradient(135deg, #059669, #10b981);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            font-weight: 700;
        }
        
        .address-value {
            font-family: monospace;
            background: #e2e8f0;
            padding: 4px 8px;
            border-radius: 6px;
            font-size: 11px;
        }
        
        /* Signatures section */
        .signatures {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 20px;
            padding-top: 20px;
            border-top: 2px solid #e2e8f0;
        }
        
        .signature-item {
            text-align: center;
            flex: 1;
        }
        
        .signature-line {
            width: 150px;
            height: 2px;
            background: linear-gradient(90deg, transparent, #94a3b8, #64748b, #94a3b8, transparent);
            margin: 0 auto 12px;
        }
        
        .signature-title {
            font-weight: 700;
            color: #0f172a;
            font-size: 14px;
        }
        
        .signature-subtitle {
            color: #64748b;
            font-size: 12px;
            margin-top: 5px;
        }
        
        /* Verification seal */
        .verification-seal {
            width: 80px;
            height: 80px;
            background: linear-gradient(135deg, #059669, #10b981);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: 600;
            font-size: 10px;
            text-align: center;
            padding: 15px;
            box-shadow: 0 10px 30px rgba(5, 150, 105, 0.3);
            border: 3px solid white;
            margin: 0 auto;
        }
        
        .verification-seal span {
            transform: rotate(-10deg);
        }
        
        /* Footer */
        .footer {
            margin-top: auto;
            text-align: center;
            color: #94a3b8;
            font-size: 11px;
            padding-top: 15px;
        }
        
        .footer .cert-id {
            font-family: monospace;
            background: #f1f5f9;
            padding: 4px 12px;
            border-radius: 20px;
            display: inline-block;
            margin-top: 8px;
            font-size: 10px;
        }
        
        /* Watermark */
        .watermark {
            position: absolute;
            bottom: 80px;
            right: 80px;
            font-size: 100px;
            font-weight: 800;
            color: rgba(0, 0, 0, 0.02);
            transform: rotate(-15deg);
            z-index: 1;
            pointer-events: none;
            white-space: nowrap;
        }
    </style>
</head>
<body>
    <div class="certificate-container">
        <!-- Background pattern -->
        <div class="bg-pattern"></div>
        
        <!-- Gradient border based on difficulty -->
        <div class="border-gradient"></div>
        
        <!-- Corner decorations -->
        <div class="corner corner-tl"></div>
        <div class="corner corner-tr"></div>
        <div class="corner corner-bl"></div>
        <div class="corner corner-br"></div>
        
        <!-- NFT Badge -->
        <div class="nft-badge">
            SOULBOUND TOKEN
        </div>
        
        <div class="certificate-content">
            <!-- Header -->
            <div class="header">
                <div class="header-top">BLOCKCHAIN VERIFIED</div>
                <div class="header-title">CERTIFICATE</div>
                <div class="header-title" style="font-size: 42px; margin-top: -10px;">OF ACHIEVEMENT</div>
                <div class="header-subtitle">This certifies that</div>
            </div>
            
            <!-- Recipient -->
            <div class="recipient-section">
                <div class="recipient-name">${profile.fname} ${profile.lname}</div>
                <div class="achievement-text">has successfully completed all requirements and demonstrated exceptional proficiency in</div>
            </div>
            
            <!-- Course & Difficulty -->
            <div style="text-align: center;">
                <div class="course-name">${course.courseName}</div>
                <div class="difficulty-badge">${difficultyText} LEVEL</div>
            </div>
            
            <!-- Details Grid -->
            <div class="details-grid">
                <div class="detail-column">
                    <h4>Course Details</h4>
                    <div class="detail-item">
                        <span class="detail-label">Certificate ID</span>
                        <span class="detail-value">${certificateId}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Course ID</span>
                        <span class="detail-value">#${course.courseId}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Difficulty</span>
                        <span class="detail-value highlight">${difficultyText}</span>
                    </div>
                </div>
                
                <div class="detail-column">
                    <h4>Blockchain Details</h4>
                    <div class="detail-item">
                        <span class="detail-label">Issue Date</span>
                        <span class="detail-value">${issueDate}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Student ID</span>
                        <span class="detail-value address-value">${accountAddress.substring(0, 10)}...${accountAddress.substring(accountAddress.length - 6)}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Token Type</span>
                        <span class="detail-value highlight">Soulbound (SBT)</span>
                    </div>
                </div>
            </div>
            
            <!-- Signatures and Seal -->
            <div class="signatures">
                <div class="signature-item">
                    <div class="signature-line"></div>
                    <div class="signature-title">Platform Director</div>
                    <div class="signature-subtitle">CodePinnacle Academy</div>
                </div>
                
                <div class="signature-item">
                    <div class="verification-seal">
                        <span>BLOCKCHAIN<br>VERIFIED</span>
                    </div>
                </div>
                
                <div class="signature-item">
                    <div class="signature-line"></div>
                    <div class="signature-title">Digital Seal</div>
                    <div class="signature-subtitle">Immutable Record</div>
                </div>
            </div>
            
            <!-- Footer -->
            <div class="footer">
                <div>This certificate is permanently recorded on the Sepolia blockchain as a Soulbound Token (non-transferable)</div>
                <div class="cert-id">Verification ID: ${certificateId}</div>
            </div>
        </div>
        
        <!-- Watermark -->
        <div class="watermark">CODEPINNACLE</div>
    </div>
</body>
</html>`;

            // Create temporary container
            const container = document.createElement('div');
            container.style.position = 'absolute';
            container.style.left = '-9999px';
            container.style.top = '-9999px';
            container.style.width = '800px';
            container.style.height = '1000px';
            container.innerHTML = htmlContent;

            document.body.appendChild(container);

            // Wait for fonts to load
            await waitForFonts();

            // Find the certificate container element
            const certificateElement = container.querySelector('.certificate-container');

            // Convert to canvas with high quality
            const canvas = await html2canvas(certificateElement, {
                scale: 3, // Very high resolution for print quality
                useCORS: true,
                allowTaint: false,
                backgroundColor: null, // Transparent background
                width: 800,
                height: 1000,
                logging: false,
                onclone: (clonedDoc) => {
                    const style = clonedDoc.createElement('style');
                    style.textContent = `
                        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
                    `;
                    clonedDoc.head.appendChild(style);
                }
            });

            // Clean up
            document.body.removeChild(container);

            // Convert to blob
            canvas.toBlob((blob) => {
                if (blob) {
                    const file = new File(
                        [blob],
                        `certificate-${course.courseId}-${accountAddress.substring(0, 6)}.png`,
                        { type: 'image/png' }
                    );
                    resolve(file);
                } else {
                    reject(new Error('Failed to create image blob'));
                }
            }, 'image/png', 1.0);

        } catch (error) {
            console.error('Error generating certificate image:', error);
            reject(error);
        }
    });
};

export const generateCertificateHTML = (profile, course, account) => {
    const accountAddress = typeof account === 'string' ? account : account?.address;
    const certificateId = `CERT-${Date.now().toString().slice(-8)}-${course.courseId}`;

    return `
<!DOCTYPE html>
<html>
<head>
    <title>Certificate of Completion - ${course.courseName}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Inter', sans-serif; 
            background: #0f172a;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            padding: 20px;
        }
        .certificate { 
            width: 800px;
            background: white; 
            border-radius: 24px; 
            overflow: hidden;
            box-shadow: 0 30px 60px rgba(0,0,0,0.3);
        }
        .content { padding: 60px; }
        h1 { font-size: 48px; background: linear-gradient(135deg, #fbbf24, #d97706); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .name { font-size: 42px; font-weight: 800; color: #0f172a; }
        .course { font-size: 32px; color: #334155; }
    </style>
</head>
<body>
    <div class="certificate">
        <div class="content">
            <h1>CERTIFICATE OF ACHIEVEMENT</h1>
            <p>Presented to</p>
            <div class="name">${profile.fname} ${profile.lname}</div>
            <p>for completing</p>
            <div class="course">${course.courseName}</div>
            <p style="margin-top: 40px;">Certificate ID: ${certificateId}</p>
            <p>Student: ${accountAddress ? accountAddress.substring(0, 10) + '...' : 'N/A'}</p>
            <p>Issued: ${new Date().toLocaleDateString()}</p>
        </div>
    </div>
</body>
</html>`;
};