/* DESK (3주차): 게임 기획자의 새벽 작업실. Theme data and room for the Back Stage engine.
   Room: x -5..5 (left wall = bookshelf + sideboard, right wall = whiteboard, safe, exit door),
   z -4.5 (desk under the window, cork board) .. 4.5 (back wall: poster, mailbox, tablet), ceiling 3.8. */
(() => {
'use strict';
const api = BackStage.api;
const { THREE, scene, TAU, AZ, DIGITS, M, Bm, bx, cy, mesh, grp, collide, rng, tex, imgTex, plane, rrect, glow, buildDust,
  zl, V3, props, locks3d, tickers, padlock, makeInteract, exitDoor, poster, framed, tween, ease, P, ptext, kid, PW, PH } = api;

const HAND = '"Nanum Pen Script", "IBM Plex Sans KR", cursive';
const TYPE = '"Special Elite", "IBM Plex Mono", monospace';
const SANS = '"IBM Plex Sans KR", sans-serif';

/* ---------------------------------------------------------------- puzzle data */
const LOCKS = [
  { id: 'L1', no: 1, name: '작업용 노트북', type: '한글 4글자', mech: 'text', len: 4, label: '한글 4글자', hash: '1gch1rd', related: null,
    hints: ['연관 단서 없이 방 안 단서 하나로 풀립니다. 책상 위에 펼쳐진 스프링 노트 「일기장 1」을 보세요.',
      '빨간 밑줄이 그어진 글자를 찾으세요. 밑줄이 1줄, 2줄, 3줄, 4줄인 글자를 밑줄 개수 순서대로 한 글자씩 이어 읽습니다.'] },
  { id: 'L2', no: 2, name: '책상 옆 서랍장', type: '대문자 5자리', mech: 'dial', set: AZ, len: 5, hash: '1enkdw9', related: 'kakao',
    hints: ['연관 단서 「편집자 카톡」은 책상 위 낡은 「일기장 2」와 짝입니다.',
      '카톡이 연도를 알려 줍니다. 그 해의 달력으로 일기에 나온 날짜(2일, 5일, 15일, 22일)가 무슨 요일인지 따지고, 중간의 "8월"도 영어 달 이름으로 바꾸세요. 일기에 나온 순서대로 영어 이름의 첫 글자를 모읍니다.'] },
  { id: 'L3', no: 3, name: '원고 보관함', type: '한글 3글자', mech: 'text', len: 3, label: '한글 3글자', hash: 'k7flx4', related: 'email',
    hints: ['연관 단서 「편집자 이메일」은 코르크 보드의 「영어 단어 카드」와 짝입니다.',
      '이메일의 "000"은 이야기 전개에 꼭 필요한 한글 3글자입니다. 카드의 영어 단어를 하나씩 우리말 한 글자로 옮겨 차례로 이어 보세요.'] },
  { id: 'L4', no: 4, name: '현관 우편함', type: '숫자 5자리', mech: 'dial', set: DIGITS, len: 5, hash: 'xo5lrp', related: 'prison',
    hints: ['연관 단서 「지도 앱 \'감옥\'」은 코르크 보드의 「섬(시간, 감옥) = ?」 출력물과 짝입니다.',
      '"섬"은 영어 sum처럼 읽힙니다. \'시간\' 가게와 \'감옥\' 가게 화면에서 우편번호를 찾아 두 수를 더하세요.'] },
  { id: 'L5', no: 5, name: '계약서 금고', type: '대문자 4자리', mech: 'dial', set: AZ, len: 4, hash: '1kbn4dp', related: 'memo',
    hints: ['연관 단서 「화이트보드 메모」는 안락의자 옆 탁자의 「계약서에 포함된 규약」과 짝입니다.',
      '규약에서 \'포기\'라는 말이 나오는 조항 네 곳을 찾으세요. 그 문장 안, 괄호 속에 숨은 영문자를 조항 순서대로 읽습니다.'] },
  { id: 'L6', no: 6, name: '시제품 상자', type: '대문자 7자리', mech: 'dial', set: AZ, len: 7, hash: '1a4tlbk', related: 'erased',
    hints: ['연관 단서 「일부가 지워진 무언가」는 책장 라디오의 「노래」와 짝입니다.',
      '노래 제목이 그림을 읽는 방법입니다. 물감을 찍어 접은 것처럼, 좌우가 뒤집힌 오른쪽 반쪽을 다시 뒤집어 왼쪽 위 절반에 맞대면 7글자 영어가 됩니다.'] },
];

const CAPTIONS = {
  L1: ['노트북 화면이 켜졌다. 깜빡이는 커서 옆에 쓰다 만 기획서.', '서랍장 위 휴대폰이 부르르 떤다. 편집자에게서 온 카톡.'],
  L2: ['서랍장이 열렸다. 빨간 펜 자국투성이 수정본 더미.', '책장 옆 프린터가 혼자 돌아가더니 이메일 한 장을 뱉어 낸다.'],
  L3: ['원고 보관함이 열렸다. 버려진 설정 노트가 수북하다.', '우편함 옆 태블릿에 지도 앱이 켜졌다. 낯선 가게 이름 하나.'],
  L4: ['우편함이 열렸다. 반송된 원고 봉투 하나.', '화이트보드에 누군가 마커로 한 줄을 적어 내려간다.'],
  L5: ['금고가 열렸다. 도장 찍힌 계약서 한 부.', '책장 위 벽에 반쯤 지워진 빨간 글자가 떠올랐다.'],
  L6: ['시제품 상자가 열리고, 라디오 노래가 멎었다.', '작업실 문 위 램프 여섯 개가 모두 초록으로 바뀌었다.'],
};

const RENTRY = "원고 보관 및 출판 이용 규약\n\n제1조(목적)\n\n본 규약은 원고의 보관, 편집 및 출판 과정에서 필요한 절차와 기준을 정함으로써 원활한 제작과 기록 관리를 목적으로 한다.\n\n제2조(용어의 정의)\n\n① \"원고\"란 제출된 모든 문서, 삽화 및 부속 자료를 말한다.\n\n② \"관리자\"란 원고를 검토·보관하는 담당자를 말한다.\n\n원고 보관 및 출판 이용 규약\n\n제3조(원고 제출)\n\n① 제출자는 정해진 기한까지 원고를 제출하여야 한다.\n\n② 제출 형식은 문서 파일 또는 인쇄본으로 한다.\n\n③ 관리자는 접수 사실을 기록으로 남긴다.\n\n제4조(검토)\n\n① 관리자는 원고를 검토한 후 수정이 필요한 사항을 통보할 수 있다.\n\n② 경미한 오탈자는 별도의 동의 없이 수정할 수 있다.\n\n③ 중요한 내용은 제출자의 확인을 받은 후 수정한다.\n\n제5조(제출의 철회)\n\n① 제출자가 원고 제출을 포기하는 경우에는 그 사유(S)를 서면으로 제출하여야 한다.\n\n② 관리자는 제출된 사유를 기록으로 보관한다.\n\n③ 특별한 사정이 없는 한 철회 요청은 접수일 기준 7일 이내 처리한다.\n\n제6조(보관)\n\n① 접수된 원고는 안전한 장소에 보관한다.\n\n② 전자파일은 백업을 유지하여야 한다.\n\n③ 관리자는 보관 현황을 정기적으로 점검한다.\n\n제7조(열람)\n\n① 제출자는 자신의 원고를 열람할 수 있다.\n\n② 제3자의 열람은 제출자의 동의를 원칙으로 한다.\n\n③ 열람 기록은 별도로 관리한다.\n\n제8조(수정 요청)\n\n① 제출자는 검토 결과에 따라 수정본을 제출할 수 있다.\n\n② 수정본은 최종본으로 관리된다.\n\n③ 이전 버전은 기록 보존을 위해 별도 보관할 수 있다.\n\n제9조(이용 범위)\n\n① 관리자는 규약의 목적 범위 안에서만 원고를 이용한다.\n\n② 목적 외 이용이 필요한 경우 제출자의 동의를 받아야 한다.\n\n③ 이용 내역은 관리대장에 기록한다.\n\n제10조(종료)\n\n① 원고 관리가 종료된 경우 관련 기록은 규정에 따라 정리한다.\n\n② 반환을 요청받은 원고는 특별한 사정이 없는 한 반환한다.\n\n③ 본 규약에서 정하지 않은 사항은 일반적인 문서 관리 원칙에 따른다.\n\n제11조(저작자 표시)\n\n① 관리자는 저작자의 성명을 임의로 변경하여서는 아니 된다.\n\n② 저작물을 이용하는 경우 저작자의 표시를 원칙으로 한다.\n\n③ 익명 공개를 요청한 경우에는 그 의사를 존중한다.\n\n제12조(규약의 유효기간)\n\n① 본 규약은 체결일로부터 5년간 유효하다.\n\n② 기간 종료 후에도 별도 이의가 없는 경우 동일한 조건으로 1년씩 연장할 수 있다.\n\n제13조(기록 관리)\n\n① 관리자는 원고 및 관련 자료를 성실하게 관리하여야 한다.\n\n② 기록의 분실 또는 훼손이 발생하지 않도록 필요한 조치를 취한다.\n\n③ 보관 장소의 변경이 있는 경우 이를 기록으로 남긴다.\n\n제14조(보관 종료)\n\n① 장기간 보관의 필요성이 없는 경우 보관을 종료할 수 있다.\n\n② 종료 전 제출자에게 가능한 범위에서 이를 알린다.\n\n③ 종료된 자료는 관리 기준에 따라 정리한다.\n\n제15조(내용 변경)\n\n① 규약의 변경은 당사자의 합의에 따른다.\n\n② 변경 사항은 문서로 작성하여야 효력이 발생한다.\n\n③ 변경 이력은 별도로 관리한다.\n\n제16조(권한의 이전)\n\n① 관리자는 정당한 사유 없이 권한을 제3자에게 이전할 수 없다.\n\n② 업무상 필요한 경우에는 별도의 승인 절차를 거친다.\n\n③ 이전된 권한의 범위는 문서에 명시한다.\n\n제17조(비밀 유지)\n\n① 업무 과정에서 알게 된 비공개 정보는 외부에 공개하여서는 아니 된다.\n\n② 본 조항은 규약 종료 후에도 효력을 가진다.\n\n③ 자료의 복사 및 반출은 승인된 경우에만 허용한다.\n\n제18조(손해 발생)\n\n① 일방의 과실로 상대방에게 손해가 발생한 경우 그 책임을 부담한다.\n\n② 천재지변 등 불가피한 사유는 예외로 한다.\n\n③ 손해 발생 사실은 기록으로 남긴다.\n\n제19조(예외 사항)\n\n① 예상하지 못한 상황으로 규약의 이행이 어려운 경우 당사자는 상호 협의한다.\n\n② 협의 결과는 문서로 작성한다.\n\n③ 필요한 경우 일정의 변경을 허용할 수 있다.\n\n제20조(분쟁 해결)\n\n① 규약과 관련하여 의견 차이가 발생한 경우 우선 협의를 통해 해결하도록 한다.\n\n② 협의가 이루어지지 않는 경우에는 관계 법령 및 일반적인 문서 관리 원칙을 참고한다.\n\n③ 모든 협의 내용은 기록으로 보관한다.\n\n③ \"이용\"이란 인쇄, 전자화, 보관 및 열람을 포함한 모든 절차를 말한다.\n\n원고 보관 및 출판 이용 규약 (3편)\n\n제21조(계약의 중단)\n\n① 제출자 또는 관리자는 부득이한 사유가 있는 경우 규약의 이행을 일시적으로 중단할 수 있다.\n\n② 중단 사유가 해소된 경우 가능한 한 신속히 절차를 재개한다.\n\n③ 중단 기간 중 발생한 사항은 별도로 기록한다.\n\n제22조(제출의 철회)\n\n① 제출자가 원고 제출을 포기하는 경우에는 통지(T) 절차에 따라 관리자에게 그 의사를 알려야 한다.\n\n② 관리자는 통지를 받은 날부터 관련 기록을 정리하고 처리 결과를 보관한다.\n\n③ 제출자는 철회 완료 전까지 필요한 자료를 회수할 수 있다.\n\n제23조(권리의 회복)\n\n① 철회된 원고라도 당사자의 합의가 있는 경우 다시 접수할 수 있다.\n\n② 재접수된 원고는 신규 접수와 동일한 절차를 따른다.\n\n③ 이전 기록은 참고자료로만 보관한다.\n\n제24조(규약의 해지)\n\n① 당사자 일방이 규약의 중요한 내용을 위반한 경우 상대방은 해지를 요구할 수 있다.\n\n② 해지 사실은 문서로 남겨야 한다.\n\n③ 해지 이후에도 필요한 기록은 보관한다.\n\n제25조(원고 반환)\n\n① 제출자가 반환을 요청한 경우 특별한 사정이 없는 한 이에 응한다.\n\n② 반환 사실은 관리대장에 기록한다.\n\n③ 반환 후 남은 사본은 규정에 따라 정리한다.\n\n제26조(전자자료 관리)\n\n① 전자자료는 보안장치가 적용된 저장공간에 보관한다.\n\n② 승인 없이 외부로 복제하거나 반출하여서는 아니 된다.\n\n③ 접근 권한은 담당자에게만 부여한다.\n\n제27조(개인정보)\n\n① 업무 중 취득한 개인정보는 관련 법령에 따라 관리한다.\n\n② 목적 외 사용을 금지한다.\n\n③ 보관기간이 끝난 정보는 안전하게 폐기한다.\n\n제28조(증빙자료)\n\n① 모든 처리 내역은 증빙자료와 함께 보관한다.\n\n② 제출자는 합리적인 범위에서 열람을 요청할 수 있다.\n\n③ 열람 여부 역시 기록으로 남긴다.\n\n제29조(관리 현황)\n\n① 관리자는 접수, 수정, 반환 및 폐기 현황을 정기적으로 점검한다.\n\n② 필요한 경우 보고서를 작성한다.\n\n③ 보고 자료는 일정 기간 보관한다.\n\n제30조(홍보 및 안내)\n\n① 관리자는 규약의 운영 내용을 안내자료로 제작할 수 있다.\n\n② 안내자료는 사실에 근거하여 작성한다.\n\n③ 필요한 경우 제출자의 동의를 받아 일부 내용을 활용할 수 있다.\n\n원고 보관 및 출판 이용 규약 (4편)\n\n제31조(이용 범위의 확대)\n\n① 원고를 새로운 형태로 이용하려는 경우에는 제출자와 협의한다.\n\n② 협의 내용은 문서로 작성하여 보관한다.\n\n③ 별도의 합의가 없는 경우 기존 이용 범위를 초과하여 사용할 수 없다.\n\n제32조(반환 절차)\n\n① 반환 요청이 접수된 경우 관리자는 확인 절차를 거쳐 처리한다.\n\n② 반환된 자료의 목록은 관리대장에 기록한다.\n\n③ 필요한 경우 반환 확인서를 작성할 수 있다.\n\n제33조(자료의 폐기)\n\n① 보존기간이 종료된 자료는 규정에 따라 폐기할 수 있다.\n\n② 폐기 전 목록을 작성하여 보관한다.\n\n③ 폐기 방법은 자료의 특성에 맞는 절차를 따른다.\n\n제34조(안내자료)\n\n① 관리자는 안내문, 홍보물 및 설명자료를 제작할 수 있다.\n\n② 안내자료에는 사실과 다른 내용을 기재하여서는 아니 된다.\n\n③ 제작 이력은 기록으로 남긴다.\n\n제35조(외부 공개)\n\n① 제출자의 동의 없이 원고 전부를 공개하여서는 아니 된다.\n\n② 일부 내용을 공개하는 경우에도 이용 목적을 명확히 하여야 한다.\n\n③ 공개 범위는 최소한으로 제한한다.\n\n제36조(행사 참여)\n\n① 관리자는 전시, 발표 또는 행사에 원고를 활용할 필요가 있는 경우 제출자와 협의한다.\n\n② 일정은 상호 협의를 거쳐 결정한다.\n\n③ 행사 종료 후 결과를 기록으로 남긴다.\n\n제37조(자료 이전)\n\n① 자료를 다른 보관 장소로 이전하는 경우 안전하게 운반하여야 한다.\n\n② 이전 내역은 관리대장에 기록한다.\n\n③ 이전 완료 후 이상 여부를 확인한다.\n\n제38조(철회 이후의 자료)\n\n① 제출자가 자료 이용을 포기한 경우에도 원본(O)은 보존기간 동안 안전하게 보관할 수 있다.\n\n② 원본의 반환을 요청받은 경우 특별한 사정이 없는 한 이에 응한다.\n\n③ 반환 여부는 기록으로 남긴다.\n\n제39조(전자기록)\n\n① 전자기록은 정기적으로 백업하여야 한다.\n\n② 손상된 파일은 복구 절차를 진행한다.\n\n③ 복구 내역은 별도로 관리한다.\n\n제40조(개정)\n\n① 규약의 개정은 문서로 작성한다.\n\n② 개정 이력은 이전 내용과 함께 보관한다.\n\n③ 개정 후에는 최신본을 기준으로 적용한다.\n\n원고 보관 및 출판 이용 규약 (5편 · 제41조~제50조)\n\n제41조(권리의 승계)\n\n① 관리기관의 조직 변경 또는 업무 승계가 이루어진 경우 본 규약상의 권리와 의무는 승계될 수 있다.\n\n② 승계 사실은 제출자에게 가능한 한 신속히 통지한다.\n\n③ 승계 기록은 별도로 보관한다.\n\n제42조(통지 방법)\n\n① 본 규약과 관련한 통지는 서면 또는 전자문서로 할 수 있다.\n\n② 연락처가 변경된 경우 당사자는 지체 없이 이를 알려야 한다.\n\n③ 통지 내역은 관리기록에 포함한다.\n\n제43조(권리 침해)\n\n① 제3자가 권리 침해를 주장하는 경우 당사자는 사실관계를 확인하기 위하여 상호 협력한다.\n\n② 필요한 경우 관련 자료를 제출할 수 있다.\n\n③ 조사 결과는 기록으로 보관한다.\n\n제44조(규약의 해석)\n\n① 본 규약에서 정하지 아니한 사항은 관계 법령 및 일반적인 문서 관리 원칙에 따른다.\n\n② 조항의 해석에 이견이 있는 경우 규약의 목적과 취지를 우선 고려한다.\n\n③ 필요한 경우 별도의 해석 기준을 마련할 수 있다.\n\n제45조(준거 기준)\n\n① 본 규약은 대한민국의 관계 법령 및 일반적인 문서 관리 원칙을 기준으로 해석한다.\n\n② 특별한 규정이 있는 경우에는 해당 규정을 우선 적용한다.\n\n제46조(분쟁의 관할)\n\n① 규약과 관련한 분쟁은 우선 협의를 통해 해결하도록 노력한다.\n\n② 협의가 이루어지지 아니하는 경우에는 관계 법령에 따른 절차를 따른다.\n\n③ 진행 경과는 문서로 기록한다.\n\n제47조(조항의 효력)\n\n① 본 규약의 일부 조항이 효력을 상실하더라도 나머지 조항의 효력에는 영향을 미치지 아니한다.\n\n② 무효가 된 조항은 목적에 가장 가까운 내용으로 해석한다.\n\n제48조(추가 합의)\n\n① 규약의 변경 또는 추가는 문서에 의한 합의가 있는 경우에만 효력이 발생한다.\n\n② 추가된 내용은 기존 규약과 동일한 효력을 가진다.\n\n③ 합의서는 함께 보관한다.\n\n제49조(문서의 정리)\n\n① 제출자가 자료 이용을 포기한 경우에도 관련 보관(P) 기록은 규정된 기간 동안 유지한다.\n\n② 보관이 종료된 이후에는 관련 절차에 따라 문서를 정리한다.\n\n③ 정리 결과는 관리대장에 기록한다.\n\n제50조(부칙)\n\n① 본 규약은 작성일로부터 효력을 가진다.\n\n② 본 규약에 명시되지 아니한 사항은 일반적인 문서 관리 원칙 및 관계 규정에 따른다.\n\n③ 본 규약은 동일한 내용으로 2부를 작성하여 각 1부씩 보관한다.";

const CLUES = {
  b_diary1: { title: '일기장 1', where: '책상 · 펼쳐진 스프링 노트', media: [{ type: 'img', src: 'assets/diary1.webp', alt: '줄 노트에 쓴 일기 여섯 줄. 몇몇 글자 아래에 빨간 밑줄이 한 줄에서 네 줄까지 그어져 있다.', caption: '사진을 누르면 크게 볼 수 있어요.' }] },
  b_diary2: { title: '일기장 2', where: '책상 · 낡은 일기장', media: [{ type: 'img', src: 'assets/diary2.webp', alt: '낡은 일기장에 쓴 글: 2일부터 작품을 다시 쓰기 시작했다. 5일엔 편집장 님께 이메일을 보내보자. 아 맞다 이번 달 벌써 8월이었지? 왜케 시간이 빠를까. 15일까지 원고가 완성되어야 22일엔 출판이 될 텐데 내가 할 수 있으려나..' }] },
  b_words: { title: '영어 단어 카드', where: '코르크 보드 · 단어 카드 세 장', media: [{ type: 'text', html: '<p style="font-size:28px;letter-spacing:.1em;text-align:center">DOG KITE CASTLE</p>' }] },
  b_island: { title: '섬(시간, 감옥) = ?', where: '코르크 보드 · 지도 앱 출력물', media: [
    { type: 'text', html: '<p style="font-size:24px;text-align:center;margin:0">섬(시간, 감옥) = ?</p><p style="text-align:center">(우편번호를 확인하시오.)</p>' },
    { type: 'img', src: 'assets/map_time.webp', alt: '지도 앱의 가게 화면 \'시간\'. 서울 강남구 테헤란로55길 35 1호, 지번 역삼동 695-13, 우편번호 06149.', small: true }] },
  b_terms: { title: '계약서에 포함된 규약', where: '안락의자 옆 탁자 · 출판 계약서', media: [
    { type: 'link', href: 'https://rentry.co/zs5syg3a', label: '원고 보관 및 출판 이용 규약 열기', title: '출판 계약서에 첨부된 규약 (제1조~제50조)', note: '계약서 뒤에 묶인 규약 전문입니다. 새 탭에서 열립니다.', fallback: RENTRY }] },
  /* MAMAMOO 「데칼코마니」 official MV (confirmed by the user); the original clip is not hosted */
  b_song: { title: '노래', where: '책장 · 라디오', media: [{ type: 'youtube', id: 'u8ukVmSf2ik', cover: false, label: '노래 단서', title: '라디오에서 흘러나오는 노래', note: '소리를 들을 수 없다면: 이 노래의 제목을 알아내는 것이 단서입니다.' }] },
};

const RELATED = {
  kakao: { title: '편집자 카톡', media: [{ type: 'img', src: 'assets/kakao.webp', alt: '카카오톡 대화. 편집자: 2025년 8월 15일이 원고 제출일인거 기억하시죠? 나: 열심히 준비중입니다!!' }] },
  email: { title: '편집자 이메일', media: [{ type: 'img', src: 'assets/email.webp', alt: 'RE: TIME ISLAND Semi Final \'시침증권거래소\' 5차 수정본. 작가님, 이 부분 000이 너무 떨어집니다. 제가 이 얘기 하기 싫다고 몇 번을 말합니까?? 왜케 한 번에 말귀를 알아먹지 못하세요. 이게 벌써 몇 번째에요. 더 확인 해볼 생각 안 하고 잘 보이는 것만 신경쓴거 아니죠? 그러니깐 제가 말하는 000이 진정으로 뭔지 모르는거에요 당신은' }] },
  prison: { title: '지도 앱 \'감옥\'', media: [{ type: 'img', src: 'assets/map_prison.webp', alt: '지도 앱의 가게 화면 \'감옥\' 요리주점. 대구 중구 동성로3길 32-43, 지번 삼덕동1가 28-12, 우편번호 41942.', small: true }] },
  memo: { title: '화이트보드 메모', media: [{ type: 'text', html: '<p style="font-size:19px">네 번의 \'포기\'를 하고, 주변의 말을 들으니 이젠 정답을 알 것 같다.</p>' }] },
  erased: { title: '일부가 지워진 무언가', media: [{ type: 'img', src: 'assets/erased.webp', alt: '빨간 글자 한 줄. 왼쪽 글자들은 위 절반만, 오른쪽 글자들은 좌우가 뒤집힌 채 아래 절반만 남아 있다.' }] },
};

/* ---------------------------------------------------------------- textures */
function drawWall(g, w, h) {
  const r = rng(11);
  g.fillStyle = '#2a3142'; g.fillRect(0, 0, w, h);
  for (let x = 0; x < w; x += 32) { g.fillStyle = x % 64 ? 'rgba(255,255,255,.025)' : 'rgba(0,0,0,.07)'; g.fillRect(x, 0, 16, h); }
  for (let i = 0; i < 240; i++) { g.fillStyle = `rgba(${10 + r() * 30},${12 + r() * 20},${20 + r() * 20},${0.04 + r() * 0.08})`; const x = r() * w, y = r() * h, s = 20 + r() * 110; g.beginPath(); g.ellipse(x, y, s, s * (0.4 + r()), r() * 3, 0, TAU); g.fill(); }
  g.fillStyle = '#1b1712'; g.fillRect(0, h * 0.94, w, h * 0.06);
  g.fillStyle = 'rgba(255,220,170,.08)'; g.fillRect(0, h * 0.94, w, 3);
}
function drawFloor(g, w, h) {
  const r = rng(9), n = 10, s = h / n;
  for (let j = 0; j < n; j++) { let x = -r() * 200; while (x < w) { const L = 180 + r() * 260, v = 38 + r() * 20; g.fillStyle = `rgb(${v + 26},${v + 10},${v - 6})`; g.fillRect(x, j * s, L, s); for (let k = 0; k < 6; k++) { g.fillStyle = `rgba(0,0,0,${0.05 + r() * 0.08})`; g.fillRect(x, j * s + r() * s, L, 1 + r() * 2); } g.fillStyle = 'rgba(0,0,0,.45)'; g.fillRect(x, j * s, 3, s); x += L; } g.fillStyle = 'rgba(0,0,0,.5)'; g.fillRect(0, j * s, w, 3); }
}
function drawWood(g, w, h, base = [92, 60, 34], seed = 4) {
  const r = rng(seed); g.fillStyle = `rgb(${base[0]},${base[1]},${base[2]})`; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 160; i++) { g.strokeStyle = `rgba(${20 + r() * 30},${10 + r() * 15},5,${0.08 + r() * 0.18})`; g.lineWidth = 1 + r() * 2.5; const y = r() * h; g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(w * 0.3, y + (r() - 0.5) * 30, w * 0.7, y + (r() - 0.5) * 30, w, y + (r() - 0.5) * 20); g.stroke(); }
  for (let i = 0; i < 50; i++) { g.fillStyle = `rgba(255,220,170,${r() * 0.05})`; g.fillRect(r() * w, r() * h, 20 + r() * 120, 2 + r() * 5); }
}
function paperTex(seed, lines = 12, color = '#e9e0cc', ink = 'rgba(40,40,60,.5)') {
  return tex(256, 340, (g, w, h) => { const r = rng(seed); g.fillStyle = color; g.fillRect(0, 0, w, h); g.fillStyle = ink; for (let i = 0; i < lines; i++) g.fillRect(22, 34 + i * 21, 70 + r() * 140, 4); g.fillStyle = 'rgba(0,0,0,.06)'; g.fillRect(0, 0, w, 10); if (r() < 0.4) { g.strokeStyle = 'rgba(190,30,30,.6)'; g.lineWidth = 4; g.beginPath(); g.moveTo(30, 60 + r() * 150); g.lineTo(220, 80 + r() * 150); g.stroke(); } });
}
function noteTex(lines, { bg = '#f4d26a', ink = '#2a2016', font = HAND, size = 46, w = 256, h = 256, align = 'center' } = {}) {
  return tex(w, h, (g) => {
    g.fillStyle = bg; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(0,0,0,.07)'; g.fillRect(0, 0, w, h * 0.12);
    g.fillStyle = ink; g.font = `${size}px ${font}`; g.textAlign = align; g.textBaseline = 'middle';
    lines.forEach((s, i) => g.fillText(s, align === 'center' ? w / 2 : 20, h / 2 + (i - (lines.length - 1) / 2) * size * 1.05));
  });
}
function drawNight(g, w, h) {
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#050913'); gr.addColorStop(1, '#14192a'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  const r = rng(77);
  for (let i = 0; i < 50; i++) { g.fillStyle = `rgba(255,255,255,${0.2 + r() * 0.4})`; g.fillRect(r() * w, r() * h * 0.35, 1.5, 1.5); }
  for (let layer = 0; layer < 2; layer++) for (let b = 0; b < 16; b++) {
    const bw = 30 + r() * 60, bh = h * (layer ? 0.2 + r() * 0.3 : 0.35 + r() * 0.35), x = b * (w / 16) + (r() - 0.5) * 30;
    g.fillStyle = layer ? '#070a12' : '#0c111e'; g.fillRect(x, h - bh, bw, bh);
    for (let y = h - bh + 6; y < h - 4; y += 10) for (let xx = x + 4; xx < x + bw - 4; xx += 8) if (r() < (layer ? 0.3 : 0.16)) { g.fillStyle = r() < 0.7 ? '#f6c46a' : '#cfe3ff'; g.globalAlpha = 0.5 + r() * 0.5; g.fillRect(xx, y, 4, 5); g.globalAlpha = 1; }
  }
  g.fillStyle = 'rgba(255,190,110,.12)'; g.fillRect(0, h * 0.82, w, h * 0.18);
}
function drawCork(g, w, h) {
  const r = rng(23); g.fillStyle = '#8a6440'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 2600; i++) { const v = r(); g.fillStyle = v < 0.5 ? `rgba(60,38,20,${0.2 + r() * 0.3})` : `rgba(190,150,100,${0.15 + r() * 0.25})`; g.fillRect(r() * w, r() * h, 1 + r() * 3, 1 + r() * 3); }
}
function drawIslandMap(g, w, h) {
  g.fillStyle = '#e6dcc2'; g.fillRect(0, 0, w, h);
  g.strokeStyle = 'rgba(80,110,140,.35)'; g.lineWidth = 1; for (let x = 0; x < w; x += 32) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); } for (let y = 0; y < h; y += 32) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
  const r = rng(5); g.fillStyle = '#c9b88a'; g.strokeStyle = '#5a4630'; g.lineWidth = 3; g.beginPath();
  for (let i = 0; i <= 28; i++) { const a = i / 28 * TAU, R = 0.32 * Math.min(w, h) * (0.75 + r() * 0.4); const x = w / 2 + Math.cos(a) * R * 1.3, y = h * 0.55 + Math.sin(a) * R; i ? g.lineTo(x, y) : g.moveTo(x, y); }
  g.closePath(); g.fill(); g.stroke();
  g.setLineDash([6, 6]); g.strokeStyle = '#a02a1a'; g.beginPath(); g.moveTo(w * 0.3, h * 0.6); g.bezierCurveTo(w * 0.4, h * 0.3, w * 0.6, h * 0.8, w * 0.7, h * 0.45); g.stroke(); g.setLineDash([]);
  g.fillStyle = '#a02a1a'; g.font = `700 30px ${SANS}`; g.textAlign = 'center'; g.fillText('×', w * 0.7, h * 0.47);
  g.fillStyle = '#3a2a1a'; g.font = `34px ${TYPE}`; g.fillText('TIME ISLAND', w / 2, 46);
}
function screenOff(w = 128, h = 256) {
  return tex(w, h, (g) => { const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#10141c'); gr.addColorStop(0.5, '#05070b'); gr.addColorStop(1, '#0c1018'); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(255,255,255,.05)'; g.beginPath(); g.moveTo(0, h * 0.2); g.lineTo(w, 0); g.lineTo(w, h * 0.12); g.lineTo(0, h * 0.35); g.fill(); });
}

/* ---------------------------------------------------------------- room */
const HH = 3.8;
let laptopMat, laptopDoc = [], laptopOpen = false, clockTex, radioBars = [], radioOn = true, boardTex, boardU = 0;
function buildRoom() {
  /* light: a warm desk lamp carries the room; cold city light through the window; a dim ceiling bulb and a corner floor lamp */
  scene.add(new THREE.HemisphereLight(0x8a9ac0, 0x1a1008, 0.16));
  scene.add(new THREE.AmbientLight(0xffffff, 0.035));
  const moon = new THREE.DirectionalLight(0x7f9ad8, 0.22); moon.position.set(1.5, 5, -9); moon.target.position.set(0, 0, 1); scene.add(moon, moon.target);
  const pl = (c, i, d, x, y, z) => { const l = new THREE.PointLight(c, i, d, 1); l.position.set(x, y, z); scene.add(l); return zl(1, l); };
  pl(0xffb45a, 2.2, 6.5, 0.95, 1.25, -3.85);          // desk lamp
  pl(0xffd2a0, 0.45, 11, 0, 3.45, 0.4);                // ceiling bulb
  pl(0xffa850, 0.9, 5.5, -4.3, 1.75, 4.0);             // floor lamp, reading corner
  pl(0x9fb8ff, 0.3, 2.4, -0.6, 1.15, -3.6);            // laptop glow
  pl(0xb8c4e8, 0.22, 7, 3.4, 3.0, -1.0);               // whiteboard side fill
  pl(0xffd0a0, 0.3, 7, 1.6, 2.8, 3.4);                 // back wall fill
  pl(0x8fa8e0, 0.25, 4, 0.75, 2.2, -3.9);              // window spill

  /* floor, walls, ceiling */
  mesh(new THREE.PlaneGeometry(10, 9), M(0xffffff, { map: tex(1024, 1024, drawFloor, [2, 2]), roughness: 0.7 }), 0, 0, 0).rotation.x = -Math.PI / 2;
  const wall = (w, x, z, ry, rep) => { const t = tex(1024, 512, drawWall); t.wrapS = THREE.RepeatWrapping; t.repeat.set(rep, 1); const m = mesh(new THREE.PlaneGeometry(w, HH), M(0xffffff, { map: t, roughness: 0.95 }), x, HH / 2, z); m.rotation.y = ry; return m; };
  wall(10, 0, -4.5, 0, 2); wall(10, 0, 4.5, Math.PI, 2); wall(9, -5, 0, Math.PI / 2, 2); wall(9, 5, 0, -Math.PI / 2, 2);
  const ceilT = tex(256, 256, (g, w, h) => { g.fillStyle = '#4a4740'; g.fillRect(0, 0, w, h); const r = rng(3); for (let i = 0; i < 90; i++) { g.fillStyle = `rgba(20,18,14,${r() * 0.12})`; g.fillRect(r() * w, r() * h, 2 + r() * 40, 2 + r() * 40); } }, [3, 3]);
  mesh(new THREE.PlaneGeometry(10, 9), M(0xffffff, { map: ceilT, roughness: 1 }), 0, HH, 0).rotation.x = Math.PI / 2;
  /* crown molding and a bare pendant bulb */
  const mold = M(0x1e1a16, { roughness: 0.7 });
  mesh(bx(10, 0.08, 0.06), mold, 0, HH - 0.04, -4.47); mesh(bx(10, 0.08, 0.06), mold, 0, HH - 0.04, 4.47); mesh(bx(0.06, 0.08, 9), mold, -4.97, HH - 0.04, 0); mesh(bx(0.06, 0.08, 9), mold, 4.97, HH - 0.04, 0);
  mesh(cy(0.006, 0.006, 0.3, 6), M(0x111111), 0, HH - 0.15, 0.4);
  mesh(cy(0.1, 0.16, 0.12, 20, true), M(0x2a2622, { side: THREE.DoubleSide }), 0, HH - 0.34, 0.4);
  mesh(new THREE.SphereGeometry(0.05, 12, 10), Bm(0xffe2b0), 0, HH - 0.4, 0.4);
  /* rug */
  { const t = tex(512, 384, (g, w, h) => { g.fillStyle = '#3a2420'; g.fillRect(0, 0, w, h); g.strokeStyle = '#8a5a3a'; g.lineWidth = 10; g.strokeRect(18, 18, w - 36, h - 36); g.strokeStyle = '#6a3a2a'; g.lineWidth = 4; g.strokeRect(40, 40, w - 80, h - 80); const r = rng(8); for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(${120 + r() * 60},${70 + r() * 40},${50},${r() * 0.08})`; g.fillRect(r() * w, r() * h, 3, 3); } g.fillStyle = 'rgba(200,140,90,.18)'; for (let i = 0; i < 6; i++) { g.beginPath(); g.arc(w / 2, h / 2, 30 + i * 22, 0, TAU); g.lineWidth = 3; g.strokeStyle = 'rgba(200,140,90,.16)'; g.stroke(); } });
    const rug = plane(t, 3.4, 2.5, true, { roughness: 1 }); rug.rotation.x = -Math.PI / 2; rug.position.set(-0.2, 0.006, 0.6); scene.add(rug); }

  buildFront();
  buildDesk();
  buildLeft();
  buildRight();
  buildBack();
  buildDust(0xffd9a0, 260, 9, 8);
}

function buildFront() {
  /* window over the desk, night city outside */
  const night = tex(1024, 640, drawNight);
  const wv = plane(night, 1.7, 1.3); wv.position.set(0.75, 2.25, -4.49); scene.add(wv);
  const fr = M(0x3a2c20, { roughness: 0.6 });
  mesh(bx(1.86, 0.08, 0.1), fr, 0.75, 2.94, -4.45); mesh(bx(1.86, 0.08, 0.1), fr, 0.75, 1.56, -4.45);
  mesh(bx(0.08, 1.46, 0.1), fr, -0.14, 2.25, -4.45); mesh(bx(0.08, 1.46, 0.1), fr, 1.64, 2.25, -4.45); mesh(bx(0.05, 1.3, 0.06), fr, 0.75, 2.25, -4.46);
  mesh(bx(2.0, 0.05, 0.2), M(0x4a3a2a), 0.75, 1.53, -4.4);
  glow(1, 0x6f8fd8, 2.2, 1.7, 0.75, 2.25, -4.47, 0, 0.14);
  /* blinds pulled halfway up */
  for (let i = 0; i < 6; i++) mesh(bx(1.64, 0.012, 0.04), M(0xb8b0a0, { roughness: 0.6 }), 0.75, 2.88 - i * 0.035, -4.43);

  /* cork board covered in pinned research, as in the base image */
  mesh(bx(2.5, 1.45, 0.04), M(0x3a2a1c), -1.45, 2.07, -4.48);
  const cork = plane(tex(1024, 600, drawCork), 2.4, 1.35, true, { roughness: 1 }); cork.position.set(-1.45, 2.07, -4.455); scene.add(cork);
  const pin = (x, y, c = 0xc02a20) => mesh(new THREE.SphereGeometry(0.013, 8, 6), M(c, { roughness: 0.4 }), x, y, -4.43);
  const pinned = (t, w, h, x, y, rz = 0, pc) => { const p = plane(t, w, h, true, { roughness: 0.9 }); p.position.set(x, y, -4.445); p.rotation.z = rz; scene.add(p); pin(x + Math.sin(-rz) * h * 0.42, y + Math.cos(rz) * h * 0.42, pc); return p; };
  pinned(tex(512, 400, drawIslandMap), 0.62, 0.48, -1.5, 2.42, 0.03);
  pinned(paperTex(61, 13), 0.28, 0.37, -1.55, 1.75, -0.06, 0x2a6ac0);
  pinned(paperTex(62, 9, '#e3d7bc'), 0.24, 0.32, -2.5, 2.5, 0.08);
  pinned(noteTex(['캐릭터', '관계도'], { bg: '#efe7d4', size: 40 }), 0.2, 0.2, -0.45, 2.55, 0.05, 0x2a9a50);
  pinned(noteTex(['마감!!'], { bg: '#f08a7a', size: 56 }), 0.13, 0.13, -1.0, 2.6, -0.1);
  pinned(tex(256, 192, (g, w, h) => { g.fillStyle = '#e8e2d4'; g.fillRect(0, 0, w, h); g.fillStyle = '#2b3442'; g.fillRect(12, 12, w - 24, h - 50); g.fillStyle = '#c8a46a'; g.beginPath(); g.arc(w * 0.7, 50, 18, 0, TAU); g.fill(); g.fillStyle = '#1a2230'; g.beginPath(); g.moveTo(12, h - 38); g.lineTo(90, 70); g.lineTo(150, h - 38); g.fill(); }), 0.24, 0.18, -2.45, 1.75, 0.05);
  pinned(paperTex(63, 6, '#f2eadb'), 0.2, 0.26, -0.95, 2.2, 0.12);
  /* red thread between a few pins */
  const thread = (a, b) => { const d = Math.hypot(b[0] - a[0], b[1] - a[1]); const m = mesh(bx(d, 0.004, 0.004), Bm(0xa01818), (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, -4.432); m.rotation.z = Math.atan2(b[1] - a[1], b[0] - a[0]); };
  thread([-1.5, 2.62], [-2.45, 1.82]); thread([-1.5, 2.62], [-0.45, 2.64]); thread([-1.55, 1.9], [-0.95, 2.31]);

  /* room clue: 섬(시간, 감옥) = ? (map-app printout + card) */
  { const g = grp(-2.12, 2.05, -4.44, 0);
    const p = plane(imgTex('assets/map_time.webp'), 0.24, 0.5, true, { roughness: 0.85 }); p.position.set(0, 0.06, 0); p.rotation.z = -0.03; g.add(p);
    mesh(new THREE.SphereGeometry(0.014, 8, 6), M(0xe0b020), 0, 0.29, 0.012, g);
    const card = plane(noteTex(['섬(시간, 감옥) = ?', '(우편번호를 확인하시오.)'], { bg: '#f4ecd8', size: 30, w: 384, h: 160 }), 0.3, 0.125, true); card.position.set(0.02, -0.25, 0.006); card.rotation.z = 0.04; g.add(card);
    makeInteract(g, 'clue', 'b_island', '섬(시간, 감옥) = ?', 0.48); }
  /* room clue: English word cards */
  { const g = grp(-0.72, 1.86, -4.44, 0);
    [['DOG', -0.12, 0.12, -0.08], ['KITE', 0.0, -0.02, 0.05], ['CASTLE', 0.1, -0.17, -0.04]].forEach(([wd, x, y, rz]) => {
      const c = plane(noteTex([wd], { bg: '#f7f2e4', font: TYPE, size: 54, w: 256, h: 128 }), 0.2, 0.1, true); c.position.set(x, y, 0.004 + x * 0.01); c.rotation.z = rz; g.add(c);
      mesh(new THREE.SphereGeometry(0.011, 8, 6), M(0x2a7ac8), x, y + 0.04, 0.012, g); });
    makeInteract(g, 'clue', 'b_words', '영어 단어 카드', 0.38); }
}

function buildDesk() {
  const D = grp(0, 0, -3.85, 0);
  const deskTop = M(0xffffff, { map: tex(1024, 512, (g, w, h) => drawWood(g, w, h, [96, 62, 34], 4)), roughness: 0.55 });
  mesh(bx(2.9, 0.06, 1.15), deskTop, 0, 0.78, 0, D);
  const dk = M(0x4a2e18, { roughness: 0.6 });
  mesh(bx(0.06, 0.75, 1.05), dk, -1.38, 0.375, 0, D); mesh(bx(0.06, 0.75, 1.05), dk, 1.38, 0.375, 0, D);
  mesh(bx(2.7, 0.42, 0.03), dk, 0, 0.53, -0.5, D);
  mesh(bx(0.9, 0.12, 0.02), M(0x5a381e), 0, 0.68, 0.576, D); mesh(bx(0.16, 0.025, 0.03), M(0xb89a60, { metalness: 0.7, roughness: 0.35 }), 0, 0.68, 0.59, D);
  collide(0, -3.85, 2.95, 1.2);
  const TOP = 0.81;

  /* L1: the work laptop (lock screen until opened, then the draft with a blinking cursor) */
  { const g = grp(-0.6, TOP, -0.12, 0.14, D);
    mesh(bx(0.44, 0.018, 0.3), M(0x9a9ea6, { metalness: 0.7, roughness: 0.35 }), 0, 0.009, 0, g);
    const kb = plane(tex(256, 160, (c, w, h) => { c.fillStyle = '#2a2c30'; c.fillRect(0, 0, w, h); c.fillStyle = '#16171a'; for (let r = 0; r < 5; r++) for (let k = 0; k < 13; k++) c.fillRect(10 + k * 18.2, 10 + r * 18, 15, 14); c.fillStyle = '#3a3c42'; c.fillRect(80, 112, 96, 40); }), 0.38, 0.17, true, { roughness: 0.5 });
    kb.rotation.x = -Math.PI / 2; kb.position.set(0, 0.0185, -0.04); g.add(kb);
    const lid = grp(0, 0.018, -0.15, 0, g); lid.rotation.x = -0.26;
    mesh(bx(0.44, 0.29, 0.012), M(0x9a9ea6, { metalness: 0.7, roughness: 0.35 }), 0, 0.145, 0, lid);
    const lockScr = tex(512, 320, (c, w, h) => {
      const gr = c.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#1a2440'); gr.addColorStop(1, '#3a2a40'); c.fillStyle = gr; c.fillRect(0, 0, w, h);
      c.fillStyle = 'rgba(255,255,255,.9)'; c.textAlign = 'center'; c.font = `600 54px ${SANS}`; c.fillText('03:47', w / 2, 90);
      c.fillStyle = '#d8dce8'; c.beginPath(); c.arc(w / 2, 150, 26, 0, TAU); c.fill(); c.fillStyle = '#1a2440'; c.beginPath(); c.arc(w / 2, 144, 9, 0, TAU); c.fill(); c.beginPath(); c.arc(w / 2, 168, 15, Math.PI, 0); c.fill();
      c.fillStyle = 'rgba(255,255,255,.18)'; rrect(c, w / 2 - 120, 200, 240, 40, 20); c.fill(); c.fillStyle = '#e8ecf4'; c.font = `400 22px ${SANS}`; c.fillText('암호 · 한글 4글자', w / 2, 227);
      c.fillStyle = 'rgba(255,255,255,.6)'; c.font = `400 18px ${SANS}`; c.fillText('TIME ISLAND 작업용', w / 2, 280); });
    const docTex = on => tex(512, 320, (c, w, h) => {
      c.fillStyle = '#f4f2ee'; c.fillRect(0, 0, w, h); c.fillStyle = '#3a4a6a'; c.fillRect(0, 0, w, 26); c.fillStyle = '#e8ecf4'; c.font = `400 15px ${SANS}`; c.textAlign = 'left'; c.fillText('TIME_ISLAND_기획서_v6.doc', 12, 18);
      c.fillStyle = '#1a1a1a'; c.font = `600 26px ${SANS}`; c.fillText('TIME ISLAND', 40, 72); c.font = `400 17px ${SANS}`; c.fillStyle = '#555'; c.fillText('— 시간을 소재로 한 게임 기획 (6차) —', 40, 100);
      const r = rng(31); c.fillStyle = '#8a8a8a'; for (let i = 0; i < 7; i++) c.fillRect(40, 130 + i * 22, 140 + r() * 280, 7);
      c.fillStyle = '#c03030'; c.fillRect(40, 130 + 2 * 22 + 2, 300, 3);
      c.fillStyle = '#8a8a8a'; c.fillRect(40, 130 + 7 * 22, 60, 7);
      if (on) { c.fillStyle = '#111'; c.fillRect(106, 130 + 7 * 22 - 8, 3, 22); } });
    laptopDoc = [docTex(true), docTex(false)];
    const scr = plane(lockScr, 0.4, 0.25); scr.position.set(0, 0.148, 0.0065); lid.add(scr); laptopMat = scr.material;
    const st = plane(noteTex(['마감 D-3'], { size: 50, w: 192, h: 128 }), 0.07, 0.05, true); st.position.set(-0.19, 0.27, 0.0068); st.rotation.z = 0.12; lid.add(st);
    glow(1, 0x9fb8ff, 0.7, 0.5, 0, 0.16, 0.03, 0, 0.12, lid);
    makeInteract(g, 'lock', 'L1', '작업용 노트북', 0.55); }

  /* mug, TIME ISLAND notebook */
  mesh(cy(0.045, 0.04, 0.1, 18), M(0x3a3634, { metalness: 0.5, roughness: 0.4 }), -1.12, TOP + 0.05, 0.08, D);
  mesh(new THREE.TorusGeometry(0.028, 0.008, 6, 12), M(0x3a3634, { metalness: 0.5, roughness: 0.4 }), -1.07, TOP + 0.05, 0.08, D).rotation.y = Math.PI / 2;
  mesh(new THREE.CircleGeometry(0.04, 16), M(0x1a0e06, { roughness: 0.2 }), -1.12, TOP + 0.09, 0.08, D).rotation.x = -Math.PI / 2;
  { const g = grp(-0.98, TOP, 0.36, 0.28, D);
    const cov = tex(320, 420, (c, w, h) => { c.fillStyle = '#e8dfc8'; c.fillRect(0, 0, w, h); c.fillStyle = '#c8bca0'; for (let i = 0; i < 14; i++) c.fillRect(6, 20 + i * 28, 14, 10); c.fillStyle = '#3a2a1a'; c.font = `40px ${TYPE}`; c.textAlign = 'center'; c.fillText('TIME ISLAND', w / 2 + 10, 90); c.strokeStyle = '#6a5a40'; c.lineWidth = 2; c.strokeRect(40, 120, w - 70, 2); c.fillStyle = 'rgba(60,50,40,.5)'; for (let i = 0; i < 6; i++) c.fillRect(50, 160 + i * 26, 120 + (i * 37) % 90, 4); c.fillStyle = '#f4d26a'; c.fillRect(170, 250, 110, 100); c.fillStyle = '#2a2016'; c.font = `34px ${HAND}`; c.fillText('설정 다시', 225, 305); });
    mesh(bx(0.3, 0.02, 0.4), M(0xd8cfb8), 0, 0.01, 0, g);
    const cp = plane(cov, 0.3, 0.4, true); cp.rotation.x = -Math.PI / 2; cp.position.y = 0.021; g.add(cp); }

  /* room clue: 일기장 1 (open spiral notebook in front) */
  { const g = grp(-0.1, TOP, 0.22, -0.06, D);
    mesh(bx(0.53, 0.014, 0.43), M(0x2a2a30), 0, 0.007, 0, g);
    const p = plane(imgTex('assets/diary1.webp'), 0.5, 0.4, true, { roughness: 0.9 }); p.rotation.x = -Math.PI / 2; p.position.y = 0.0145; g.add(p);
    makeInteract(g, 'clue', 'b_diary1', '일기장 1', 0.42); }
  /* room clue: 일기장 2 (old diary, right) */
  { const g = grp(0.66, TOP, 0.2, 0.1, D);
    mesh(bx(0.58, 0.025, 0.34), M(0x3a2214, { roughness: 0.7 }), 0, 0.0125, 0, g);
    const p = plane(imgTex('assets/diary2.webp'), 0.56, 0.315, true, { roughness: 0.9 }); p.rotation.x = -Math.PI / 2; p.position.y = 0.026; g.add(p);
    const pen = mesh(cy(0.006, 0.006, 0.16, 8), M(0x111111, { roughness: 0.3 }), 0.24, 0.035, 0.05, g); pen.rotation.z = Math.PI / 2; pen.rotation.y = 0.5;
    makeInteract(g, 'clue', 'b_diary2', '일기장 2', 0.42); }

  /* books along the back, the desk clock in front of them */
  { const r = rng(17); let x = -0.36;
    for (let i = 0; i < 10; i++) { const w = 0.035 + r() * 0.03, h = 0.22 + r() * 0.08; const b = mesh(bx(w, h, 0.17), M([0x4a2a1a, 0x2a3a4a, 0x5a4a2a, 0x3a2420, 0x2a2a2a, 0x6a5038][(r() * 6) | 0], { roughness: 0.75 }), x + w / 2, TOP + h / 2, -0.46, D); b.rotation.z = i === 9 ? -0.12 : 0; x += w + 0.004; } }
  clockTex = tex(256, 256, () => {}); drawClock(0);
  { const g = grp(0.08, TOP, -0.3, -0.08, D);
    mesh(bx(0.2, 0.2, 0.07), M(0x1a1714, { roughness: 0.4 }), 0, 0.1, 0, g);
    const f = mesh(new THREE.CircleGeometry(0.082, 32), Bm(0xd8d0c0, { map: clockTex }), 0, 0.105, 0.036, g); void f;
    mesh(new THREE.TorusGeometry(0.084, 0.006, 6, 32), M(0xb89a60, { metalness: 0.7, roughness: 0.3 }), 0, 0.105, 0.037, g); }
  /* tin and a framed sketch, as in the base image */
  mesh(cy(0.06, 0.06, 0.16, 18), M(0x2a2622, { metalness: 0.5, roughness: 0.45 }), 0.36, TOP + 0.08, -0.4, D);
  mesh(bx(0.18, 0.12, 0.13), M(0x6a5038, { roughness: 0.6 }), 0.36, TOP + 0.22, -0.4, D);
  { const g = framed(D, tex(320, 256, drawIslandMap), 0.34, 0.27, 0.75, TOP + 0.17, -0.48, -0.08, 0x3a2a1a, 0.025); g.rotation.x = -0.12; }

  /* desk lamp (black arm, dome shade) */
  { const g = grp(1.12, TOP, -0.32, 0, D), blk = M(0x141414, { metalness: 0.6, roughness: 0.35 });
    mesh(cy(0.09, 0.1, 0.03, 20), blk, 0, 0.015, 0, g);
    const a1 = mesh(cy(0.012, 0.012, 0.5, 8), blk, 0.04, 0.26, -0.02, g); a1.rotation.z = -0.18;
    const a2 = mesh(cy(0.012, 0.012, 0.45, 8), blk, -0.1, 0.56, 0.06, g); a2.rotation.z = 1.05; a2.rotation.y = 0.5;
    const shade = mesh(cy(0.04, 0.13, 0.13, 22, true), M(0x111111, { side: THREE.DoubleSide, metalness: 0.5, roughness: 0.4 }), -0.28, 0.6, 0.16, g); shade.rotation.z = 0.35;
    mesh(new THREE.SphereGeometry(0.045, 14, 10), Bm(0xfff0c8), -0.27, 0.56, 0.16, g);
    glow(1, 0xffc070, 0.9, 0.9, -0.27, 0.52, 0.2, 0, 0.35, g); }

  /* scattered papers, sticky notes, a map sheet */
  const flat = (t, w, h, x, z, rz, y = 0.002) => { const p = plane(t, w, h, true, { roughness: 0.9 }); p.rotation.x = -Math.PI / 2; p.rotation.z = rz; p.position.set(x, TOP + y, z); D.add(p); return p; };
  flat(paperTex(71, 12), 0.22, 0.29, 0.3, -0.1, 0.35);
  flat(paperTex(72, 10, '#e4d9c2'), 0.22, 0.29, 0.2, -0.16, -0.2, 0.003);
  flat(tex(512, 384, drawIslandMap), 0.5, 0.38, 1.05, 0.12, -0.25, 0.003);
  flat(paperTex(73, 14), 0.22, 0.29, 1.2, 0.36, 0.5, 0.004);
  flat(noteTex(['왜?'], { size: 70, w: 128, h: 128 }), 0.07, 0.07, 0.48, -0.12, 0.3, 0.005);
  flat(noteTex(['또 수정'], { bg: '#f0b0a0', size: 44, w: 128, h: 128 }), 0.07, 0.07, -0.35, 0.05, -0.2, 0.004);
  flat(paperTex(74, 8, '#efe7d4'), 0.2, 0.26, -1.25, -0.3, 0.2, 0.002);
  /* crumpled paper balls on the desk */
  for (const [x, z] of [[-0.42, -0.3], [0.95, -0.2]]) mesh(new THREE.IcosahedronGeometry(0.035, 0), M(0xe8e0cc, { flatShading: true, roughness: 1 }), x, TOP + 0.03, z, D);

  /* chair in front of the desk */
  { const g = grp(0.15, 0, -2.88, Math.PI + 0.12), wd = M(0x4a2e18, { roughness: 0.6 });
    mesh(bx(0.48, 0.05, 0.46), wd, 0, 0.47, 0, g);
    for (const [x, z] of [[-0.21, -0.2], [0.21, -0.2], [-0.21, 0.2], [0.21, 0.2]]) mesh(bx(0.04, 0.47, 0.04), wd, x, 0.235, z, g);
    mesh(bx(0.04, 0.5, 0.04), wd, -0.21, 0.75, -0.2, g); mesh(bx(0.04, 0.5, 0.04), wd, 0.21, 0.75, -0.2, g);
    mesh(bx(0.46, 0.14, 0.03), wd, 0, 0.92, -0.2, g); mesh(bx(0.46, 0.05, 0.03), wd, 0, 0.7, -0.2, g);
    collide(0.15, -2.88, 0.5, 0.5); }

  /* L2: drawer pedestal right of the desk, the phone on its stand on top (the editor's KakaoTalk wakes here) */
  { const g = grp(2.0, 0, -3.95, 0);
    mesh(bx(0.55, 0.72, 0.6), M(0x4a2e18, { roughness: 0.6 }), 0, 0.36, 0, g);
    mesh(bx(0.58, 0.03, 0.63), deskTop, 0, 0.735, 0, g);
    for (let i = 0; i < 3; i++) { mesh(bx(0.49, 0.2, 0.02), M(0x5a381e, { roughness: 0.55 }), 0, 0.6 - i * 0.22, 0.305, g); mesh(bx(0.12, 0.02, 0.025), M(0xb89a60, { metalness: 0.7, roughness: 0.35 }), 0, 0.64 - i * 0.22, 0.32, g); }
    locks3d.L2 = padlock(g, 0.14, 0.58, 0.34, 0.75);
    const ph = grp(0.02, 0.75, 0.02, -0.15, g);
    mesh(bx(0.12, 0.012, 0.1), M(0x222222), 0, 0.006, 0, ph);
    const body = grp(0, 0.012, 0.0, 0, ph); body.rotation.x = -0.4;
    mesh(bx(0.11, 0.21, 0.012), M(0x111214, { metalness: 0.5, roughness: 0.3 }), 0, 0.105, -0.01, body);
    const off = screenOff();
    const on = tex(256, 512, (c, w, h) => {
      c.fillStyle = '#b2c7d9'; c.fillRect(0, 0, w, h); c.fillStyle = '#f2f2f2'; c.fillRect(0, 0, w, 56); c.fillStyle = '#222'; c.font = `600 22px ${SANS}`; c.textAlign = 'center'; c.fillText('편집자', w / 2, 36);
      c.fillStyle = '#7a99b8'; rrect(c, 12, 80, 36, 36, 12); c.fill(); c.textAlign = 'left'; c.fillStyle = '#333'; c.font = `400 15px ${SANS}`; c.fillText('편집자', 56, 92);
      c.fillStyle = '#fff'; rrect(c, 56, 100, 186, 66, 14); c.fill(); c.fillStyle = '#111'; c.font = `400 16px ${SANS}`; c.fillText('2025년 8월 15일이', 68, 126); c.fillText('원고 제출일인거 기억하시죠?', 68, 150);
      c.fillStyle = '#555'; c.font = `400 11px ${SANS}`; c.fillText('오후 7:45', 190, 182);
      c.fillStyle = '#fae100'; rrect(c, 92, 200, 150, 40, 14); c.fill(); c.fillStyle = '#111'; c.font = `400 16px ${SANS}`; c.fillText('열심히 준비중입니다!!', 102, 226);
      c.fillStyle = '#f6f6f6'; c.fillRect(0, h - 60, w, 60); c.fillStyle = '#e4e4e4'; rrect(c, 40, h - 46, w - 80, 32, 16); c.fill(); });
    const scr = plane(off, 0.1, 0.195); scr.position.set(0, 0.105, -0.003); body.add(scr);
    props.L2 = { kind: 'screen', mat: scr.material, on };
    makeInteract(g, 'lock', 'L2', '책상 옆 서랍장', 1.25);
    collide(2.0, -3.95, 0.62, 0.66); }

  /* trash can overflowing with rejected drafts, crumpled balls on the floor */
  mesh(cy(0.18, 0.15, 0.42, 18, true), M(0x2a2a2e, { metalness: 0.4, roughness: 0.5, side: THREE.DoubleSide }), 2.75, 0.21, -3.95);
  collide(2.75, -3.95, 0.42, 0.42);
  { const r = rng(55); for (let i = 0; i < 9; i++) { const inside = i < 4; const x = inside ? 2.75 + (r() - 0.5) * 0.18 : 1.3 + r() * 2.0, z = inside ? -3.95 + (r() - 0.5) * 0.18 : -3.3 + r() * 0.9; mesh(new THREE.IcosahedronGeometry(0.05 + r() * 0.02, 0), M(0xe6dcc6, { flatShading: true, roughness: 1 }), x, inside ? 0.42 + r() * 0.04 : 0.045, z).rotation.set(r() * 3, r() * 3, 0); } }
  /* plant in the corner */
  { const g = grp(4.4, 0, -4.0, 0);
    mesh(cy(0.18, 0.14, 0.36, 16), M(0x6a4a3a, { roughness: 0.8 }), 0, 0.18, 0, g);
    const r = rng(81), lm = M(0x2a4a2a, { roughness: 0.7, side: THREE.DoubleSide });
    for (let i = 0; i < 14; i++) { const l = mesh(new THREE.PlaneGeometry(0.14, 0.5), lm, (r() - 0.5) * 0.1, 0.6 + r() * 0.4, (r() - 0.5) * 0.1, g); l.rotation.set((r() - 0.5) * 1.2, r() * TAU, (r() - 0.5) * 1.2); }
    collide(4.4, -4.0, 0.42, 0.42); }
}

function buildLeft() {
  /* bookshelf on the left wall: the radio (song) and the locked prototype box (L6) */
  const S = grp(-4.78, 0, -2.9, Math.PI / 2);   // local +z = into the room (world +x), local +x = world -z
  const wd = M(0x3a2414, { roughness: 0.65 });
  mesh(bx(1.9, 2.2, 0.03), M(0x2a1a10), 0, 1.1, -0.19, S);
  mesh(bx(0.04, 2.2, 0.4), wd, -0.93, 1.1, 0, S); mesh(bx(0.04, 2.2, 0.4), wd, 0.93, 1.1, 0, S);
  const shelfY = [0.05, 0.5, 0.95, 1.4, 1.85, 2.2];
  shelfY.forEach(y => mesh(bx(1.86, 0.03, 0.4), wd, 0, y, 0, S));
  const r = rng(29), cols = [0x5a2a1a, 0x2a3a4a, 0x6a5a3a, 0x3a2420, 0x2a2a2a, 0x7a6040, 0x4a3a5a, 0x2a4a3a];
  const fill = (y, x0, x1, tall = 0.36) => { let x = x0; while (x < x1) { const w = 0.03 + r() * 0.04, h = tall * (0.7 + r() * 0.3); if (x + w > x1) break; const b = mesh(bx(w, h, 0.26 + r() * 0.06), M(cols[(r() * cols.length) | 0], { roughness: 0.75 }), x + w / 2, y + 0.015 + h / 2, 0.02, S); if (r() < 0.08) { b.rotation.z = 0.25; b.position.x += 0.04; x += 0.06; } x += w + 0.003; } };
  fill(0.05, -0.9, 0.9, 0.4); fill(0.5, -0.9, 0.9); fill(0.95, -0.9, 0.12); fill(1.4, 0.05, 0.9); fill(1.85, -0.9, 0.6, 0.32);
  /* binders and boxes */
  for (let i = 0; i < 3; i++) mesh(bx(0.07, 0.3, 0.3), M([0x1a3a6a, 0x6a1a1a, 0x1a1a1a][i], { roughness: 0.5 }), -0.85 + i * 0.075, 1.415 + 0.15, 0.02, S);
  mesh(bx(0.3, 0.14, 0.26), M(0x8a7050), 0.73, 1.865 + 0.07, 0.02, S);

  /* room clue: radio playing a song */
  { const g = grp(-0.42, 1.415, 0.04, 0, S);
    mesh(bx(0.42, 0.24, 0.16), M(0x6a4a2a, { roughness: 0.45 }), 0, 0.12, 0, g);
    const face = tex(256, 160, (c, w, h) => { c.fillStyle = '#d8c8a0'; c.fillRect(0, 0, w, h); c.fillStyle = '#3a2a1a'; for (let y = 16; y < h - 16; y += 8) for (let x = 16; x < 130; x += 8) { c.beginPath(); c.arc(x, y, 2.4, 0, TAU); c.fill(); } c.fillStyle = '#2a2018'; rrect(c, 146, 18, 96, 46, 6); c.fill(); c.fillStyle = '#ffcf7a'; c.font = `600 18px ${TYPE}`; c.textAlign = 'center'; c.fillText('FM 89.1', 194, 48); c.fillStyle = '#6a4a2a'; c.beginPath(); c.arc(170, 112, 18, 0, TAU); c.fill(); c.beginPath(); c.arc(220, 112, 18, 0, TAU); c.fill(); });
    const fp = plane(face, 0.4, 0.22, true, { roughness: 0.6 }); fp.position.set(0, 0.12, 0.081); g.add(fp);
    mesh(cy(0.006, 0.006, 0.3, 6), M(0xcccccc, { metalness: 0.9, roughness: 0.2 }), 0.15, 0.36, -0.04, g).rotation.z = -0.5;
    for (let i = 0; i < 5; i++) { const b = mesh(bx(0.012, 0.04, 0.004), Bm(0xffb050), 0.06 + i * 0.018, 0.2, 0.083, g); radioBars.push(b); }
    glow(1, 0xffb050, 0.5, 0.4, 0.1, 0.18, 0.09, 0, 0.18, g);
    const e = makeInteract(g, 'clue', 'b_song', '라디오 · 노래', 0.34); e.sprite.position.z = 0.3; }
  /* L6: prototype box on the middle shelf */
  { const g = grp(0.5, 0.965, 0.03, 0, S);
    mesh(bx(0.5, 0.2, 0.32), M(0x1e2a3e, { roughness: 0.55 }), 0, 0.1, 0, g);
    const lid = tex(320, 128, (c, w, h) => { c.fillStyle = '#24324a'; c.fillRect(0, 0, w, h); c.strokeStyle = '#ffcf7a'; c.lineWidth = 4; c.strokeRect(8, 8, w - 16, h - 16); c.fillStyle = '#ffcf7a'; c.font = `44px ${TYPE}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('PROTO #7', w / 2, h / 2 - 8); c.font = `20px ${TYPE}`; c.fillText('TIME ISLAND', w / 2, h / 2 + 30); });
    const lp = plane(lid, 0.48, 0.19, true, { roughness: 0.5 }); lp.position.set(0, 0.1, 0.161); g.add(lp);
    locks3d.L6 = padlock(g, 0, 0.04, 0.19, 0.7);
    const e = makeInteract(g, 'lock', 'L6', '시제품 상자', 0.34); e.sprite.position.z = 0.32; }
  collide(-4.78, -2.9, 0.45, 1.95);
  /* related L6: half-erased red letters appear on the wall above the shelf */
  { const m = plane(imgTex('assets/erased.webp'), 1.55, 0.26, true, { roughness: 0.9 }); m.position.set(-4.97, 2.78, -2.9); m.rotation.y = Math.PI / 2; m.visible = false; scene.add(m);
    props.L6 = { kind: 'fade', m, drop: 0.22 }; }

  /* sideboard: printer (L3's email prints here) and the manuscript box (L3) */
  const B = grp(-4.72, 0, -0.1, Math.PI / 2);
  mesh(bx(1.7, 0.82, 0.5), M(0x3a2414, { roughness: 0.6 }), 0, 0.41, 0, B);
  mesh(bx(1.74, 0.04, 0.54), M(0xffffff, { map: tex(512, 256, (g, w, h) => drawWood(g, w, h, [80, 50, 28], 6)), roughness: 0.55 }), 0, 0.84, 0, B);
  for (const x of [-0.42, 0.42]) { mesh(bx(0.8, 0.7, 0.02), M(0x4a2e18, { roughness: 0.55 }), x, 0.41, 0.255, B); mesh(bx(0.02, 0.14, 0.025), M(0xb89a60, { metalness: 0.7 }), x + (x < 0 ? 0.34 : -0.34), 0.45, 0.27, B); }
  collide(-4.72, -0.1, 0.56, 1.76);
  { const g = grp(0.42, 0.86, 0, 0, B);
    mesh(bx(0.46, 0.2, 0.36), M(0xd8d8d4, { roughness: 0.45 }), 0, 0.1, -0.04, g);
    mesh(bx(0.42, 0.02, 0.06), M(0x2a2a2a), 0, 0.12, 0.15, g);
    mesh(bx(0.38, 0.01, 0.2), M(0xc8c8c4), 0, 0.03, 0.22, g);
    mesh(bx(0.06, 0.02, 0.01), Bm(0x5fd38d), 0.16, 0.17, 0.141, g);
    mesh(bx(0.3, 0.004, 0.22), M(0xf2f2ee), 0, 0.202, -0.12, g);
    const paper = plane(imgTex('assets/email.webp'), 0.39, 0.26, true, { roughness: 0.9 }); paper.rotation.x = -0.75; paper.position.set(0, 0.13, 0.27); paper.visible = false; g.add(paper);
    props.L3 = { kind: 'custom', reveal(instant) { paper.visible = true; tween(1.8, u => { const k = ease(u); paper.position.z = 0.02 + k * 0.25; paper.position.y = 0.2 - k * 0.07; paper.material.transparent = u < 1; paper.material.opacity = Math.min(1, u * 3); }, instant); } };
    props.L3.paper = paper; }
  { const g = grp(-0.4, 0.86, 0.02, 0, B);
    mesh(bx(0.42, 0.24, 0.32), M(0x5a3a22, { roughness: 0.6 }), 0, 0.12, 0, g);
    mesh(bx(0.44, 0.03, 0.34), M(0x4a2e18), 0, 0.245, 0, g);
    const lb = plane(noteTex(['원고 보관함'], { bg: '#efe6d2', size: 44, w: 256, h: 80 }), 0.2, 0.06, true); lb.position.set(-0.07, 0.16, 0.161); g.add(lb);
    /* a three-wheel Hangul word lock */
    const wl = grp(0.12, 0.09, 0.17, 0, g);
    mesh(bx(0.14, 0.06, 0.025), M(0xc9a13a, { metalness: 0.8, roughness: 0.3 }), 0, 0, 0, wl);
    ['ㄱ', 'ㄴ', 'ㄷ'].forEach((ch, i) => { const w = mesh(cy(0.022, 0.022, 0.03, 16), M(0x2a2a2a, { metalness: 0.4, roughness: 0.4 }), -0.04 + i * 0.04, 0, 0.018, wl); w.rotation.z = Math.PI / 2;
      const t = plane(noteTex([ch], { bg: '#e8e0c8', size: 90, w: 128, h: 128, font: SANS }), 0.022, 0.022, true); t.position.set(-0.04 + i * 0.04, 0, 0.0405); wl.add(t); });
    makeInteract(g, 'lock', 'L3', '원고 보관함', 0.6); }
  /* framed concept sketch above the sideboard */
  framed(scene, tex(400, 300, (g, w, h) => { g.fillStyle = '#e6dcc4'; g.fillRect(0, 0, w, h); g.strokeStyle = '#3a2a1a'; g.lineWidth = 3; g.beginPath(); g.arc(w / 2, h / 2, 90, 0, TAU); g.stroke(); for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; g.beginPath(); g.moveTo(w / 2 + Math.cos(a) * 80, h / 2 + Math.sin(a) * 80); g.lineTo(w / 2 + Math.cos(a) * 90, h / 2 + Math.sin(a) * 90); g.stroke(); } g.beginPath(); g.moveTo(w / 2, h / 2); g.lineTo(w / 2 + 40, h / 2 - 50); g.moveTo(w / 2, h / 2); g.lineTo(w / 2 - 60, h / 2 + 10); g.stroke(); g.fillStyle = '#3a2a1a'; g.font = `22px ${TYPE}`; g.textAlign = 'center'; g.fillText('concept #1', w / 2, h - 18); }), 0.8, 0.6, -4.96, 2.05, -0.1, Math.PI / 2, 0x2a1a10);

  /* reading corner: armchair, side table with the contract (rules), floor lamp */
  { const g = grp(-3.85, 0, 3.55, Math.PI * 0.78), fab = M(0x5a2a22, { roughness: 0.95 });
    mesh(bx(0.85, 0.42, 0.8), fab, 0, 0.21, 0, g); mesh(bx(0.8, 0.12, 0.72), M(0x6a3228, { roughness: 0.95 }), 0, 0.48, 0.03, g);
    mesh(bx(0.85, 0.65, 0.16), fab, 0, 0.72, -0.34, g); mesh(bx(0.14, 0.28, 0.76), fab, -0.42, 0.55, 0, g); mesh(bx(0.14, 0.28, 0.76), fab, 0.42, 0.55, 0, g);
    collide(-3.85, 3.55, 0.95, 0.95); }
  { const g = grp(-4.45, 0, 2.5, Math.PI / 2);
    mesh(cy(0.24, 0.24, 0.03, 24), M(0x3a2414, { roughness: 0.5 }), 0, 0.6, 0, g);
    mesh(cy(0.025, 0.025, 0.6, 10), M(0x2a1a10), 0, 0.3, 0, g); mesh(cy(0.16, 0.18, 0.02, 20), M(0x2a1a10), 0, 0.01, 0, g);
    mesh(bx(0.26, 0.03, 0.34), M(0x1a2a4a, { roughness: 0.5 }), 0.0, 0.63, 0, g);
    const cov = plane(tex(256, 340, (c, w, h) => { c.fillStyle = '#f2ecdc'; c.fillRect(0, 0, w, h); c.fillStyle = '#1a1a1a'; c.font = `700 30px ${SANS}`; c.textAlign = 'center'; c.fillText('출판 계약서', w / 2, 70); c.font = `400 17px ${SANS}`; c.fillText('원고 보관 및 출판 이용 규약 첨부', w / 2, 108); c.fillStyle = 'rgba(40,40,60,.45)'; for (let i = 0; i < 8; i++) c.fillRect(30, 150 + i * 18, 150 + (i * 31) % 50, 4); c.strokeStyle = '#c02020'; c.lineWidth = 3; c.beginPath(); c.arc(190, 290, 26, 0, TAU); c.stroke(); c.fillStyle = '#c02020'; c.font = `700 18px ${SANS}`; c.fillText('인', 190, 296); }), 0.23, 0.31, true);
    cov.rotation.x = -Math.PI / 2; cov.rotation.z = 0.15; cov.position.set(0, 0.647, 0); g.add(cov);
    makeInteract(g, 'clue', 'b_terms', '출판 계약서 · 규약', 1.05);
    collide(-4.45, 2.5, 0.5, 0.5); }
  { const g = grp(-4.5, 0, 4.1, 0);
    mesh(cy(0.14, 0.16, 0.03, 20), M(0x1a1a1a), 0, 0.015, 0, g); mesh(cy(0.012, 0.012, 1.5, 8), M(0x1a1a1a, { metalness: 0.5 }), 0, 0.77, 0, g);
    mesh(cy(0.14, 0.22, 0.28, 20, true), M(0xd8c39a, { side: THREE.DoubleSide, emissive: 0x6a4a1a, emissiveIntensity: 0.8 }), 0, 1.62, 0, g);
    glow(1, 0xffb060, 1.2, 1.0, 0.1, 1.6, 0.0, Math.PI / 4, 0.25, g);
    collide(-4.5, 4.1, 0.35, 0.35); }
}

function buildRight() {
  /* whiteboard (L5's memo gets written here) and the small safe below it (L5) */
  { mesh(bx(0.04, 1.02, 1.56), M(0xb8bcc4, { metalness: 0.6, roughness: 0.35 }), 4.98, 1.85, -1.6);
    boardTex = tex(1024, 640, () => {}); drawBoard(0);
    const b = plane(boardTex, 1.5, 0.95, true, { roughness: 0.35 }); b.position.set(4.955, 1.85, -1.6); b.rotation.y = -Math.PI / 2; scene.add(b);
    mesh(bx(0.08, 0.03, 1.4), M(0x9a9ea6, { metalness: 0.6 }), 4.93, 1.35, -1.6);
    mesh(cy(0.01, 0.01, 0.12, 8), M(0x1a3ac0), 4.92, 1.38, -1.3).rotation.x = Math.PI / 2;
    props.L5 = { kind: 'custom', reveal(instant) { tween(2.6, u => { boardU = u; drawBoard(u); }, instant); } }; }
  { const g = grp(4.72, 0, -1.6, -Math.PI / 2);
    mesh(bx(0.52, 0.6, 0.46), M(0x3a3e44, { metalness: 0.6, roughness: 0.4 }), 0, 0.3, 0, g);
    mesh(bx(0.44, 0.5, 0.02), M(0x4a4e56, { metalness: 0.6, roughness: 0.35 }), 0, 0.3, 0.235, g);
    mesh(cy(0.06, 0.06, 0.03, 24), M(0xb8b8b8, { metalness: 0.85, roughness: 0.25 }), -0.08, 0.34, 0.25, g).rotation.x = Math.PI / 2;
    mesh(bx(0.03, 0.12, 0.03), M(0xb8b8b8, { metalness: 0.85, roughness: 0.25 }), 0.12, 0.34, 0.26, g);
    locks3d.L5 = padlock(g, 0.12, 0.22, 0.27, 0.75);
    mesh(bx(0.3, 0.04, 0.22), M(0xefe6d2), 0, 0.62, 0, g);
    makeInteract(g, 'lock', 'L5', '계약서 금고', 0.95);
    collide(4.72, -1.6, 0.52, 0.6); }
  /* a coat rack and framed rejection letter on the right wall */
  { const g = framed(scene, tex(256, 340, (c, w, h) => { c.fillStyle = '#f2ecdc'; c.fillRect(0, 0, w, h); c.fillStyle = '#222'; c.font = `600 22px ${SANS}`; c.textAlign = 'center'; c.fillText('공모전 결과 안내', w / 2, 50); c.fillStyle = 'rgba(40,40,60,.45)'; for (let i = 0; i < 9; i++) c.fillRect(30, 90 + i * 20, 160 + (i * 23) % 40, 4); c.fillStyle = '#b02020'; c.font = `700 30px ${SANS}`; c.fillText('아쉽게도...', w / 2, 300); }), 0.4, 0.53, 4.96, 1.9, 0.0, -Math.PI / 2, 0x1a1410, 0.03); void g; }
  /* exit door in the right wall, toward the back */
  exitDoor({ x: 5, z: 2.5, ry: Math.PI / 2, leaf: 0x3a2a20, frame: 0x8a7a60, sign: 'EXIT' });
}

function buildBack() {
  /* theme poster */
  poster({ x: -1.5, z: 4.47, ry: Math.PI, y: 2.0, w: 1.25, h: 1.0 });
  /* L4: wall mailbox; the tablet on the shelf beside it shows the map app */
  { const g = grp(0.95, 0, 4.36, Math.PI);
    mesh(bx(0.42, 0.52, 0.2), M(0x8a2a22, { metalness: 0.4, roughness: 0.45 }), 0, 1.3, 0, g);
    mesh(bx(0.44, 0.06, 0.22), M(0x6a1e18, { metalness: 0.4, roughness: 0.45 }), 0, 1.58, 0, g);
    mesh(bx(0.3, 0.025, 0.01), M(0x1a1a1a), 0, 1.45, 0.101, g);
    const lb = plane(tex(256, 96, (c, w, h) => { c.fillStyle = '#efe6d2'; c.fillRect(0, 0, w, h); c.fillStyle = '#8a2a22'; c.font = `700 48px ${SANS}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('우 편', w / 2, h / 2 + 2); }), 0.18, 0.068, true); lb.position.set(0, 1.33, 0.101); g.add(lb);
    locks3d.L4 = padlock(g, 0, 1.15, 0.13, 0.8);
    makeInteract(g, 'lock', 'L4', '현관 우편함', 1.8); }
  { const g = grp(1.8, 0, 4.36, Math.PI);
    mesh(bx(0.56, 0.03, 0.22), M(0x3a2414, { roughness: 0.6 }), 0, 1.12, 0, g);
    for (const x of [-0.22, 0.22]) mesh(bx(0.02, 0.12, 0.16), M(0x1a1a1a, { metalness: 0.5 }), x, 1.06, -0.02, g);
    const tb = grp(0, 1.135, 0.02, 0, g); tb.rotation.x = -0.12;
    mesh(bx(0.36, 0.72, 0.016), M(0x1a1b1e, { metalness: 0.5, roughness: 0.3 }), 0, 0.36, 0, tb);
    const scr = plane(screenOff(128, 256), 0.32, 0.67); scr.position.set(0, 0.36, 0.0085); tb.add(scr);
    props.L4 = { kind: 'screen', mat: scr.material, on: imgTex('assets/map_prison.webp') }; }
  /* wall sconce between the poster and the mailbox */
  { mesh(bx(0.1, 0.16, 0.05), M(0x2a2420, { metalness: 0.6, roughness: 0.4 }), -0.25, 2.35, 4.47);
    mesh(cy(0.07, 0.11, 0.16, 18, true), M(0xd8c39a, { side: THREE.DoubleSide, emissive: 0x7a5a2a, emissiveIntensity: 0.9 }), -0.25, 2.48, 4.38);
    glow(1, 0xffb060, 1.4, 1.4, -0.25, 2.45, 4.44, Math.PI, 0.3);
    const l = new THREE.PointLight(0xffb868, 0.55, 4.5, 1); l.position.set(-0.25, 2.4, 4.2); scene.add(l); zl(1, l); }
  /* low cabinet under the travel map: stacked game boxes and a record of past drafts */
  { const g = grp(3.4, 0, 4.22, Math.PI), wd = M(0x3a2414, { roughness: 0.6 });
    mesh(bx(1.3, 0.62, 0.42), wd, 0, 0.31, 0, g); mesh(bx(1.34, 0.03, 0.46), M(0x4a2e18, { roughness: 0.5 }), 0, 0.635, 0, g);
    for (const x of [-0.32, 0.32]) { mesh(bx(0.6, 0.52, 0.02), M(0x4a2e18, { roughness: 0.55 }), x, 0.31, 0.215, g); mesh(bx(0.02, 0.1, 0.02), M(0xb89a60, { metalness: 0.7 }), x + (x < 0 ? 0.25 : -0.25), 0.36, 0.23, g); }
    const r = rng(44); let y = 0.65;
    for (let i = 0; i < 4; i++) { const h = 0.05 + r() * 0.04; const b = mesh(bx(0.42 - i * 0.03, h, 0.3 - i * 0.02), M([0x6a2a22, 0x22344a, 0x3a5a3a, 0x7a6040][i], { roughness: 0.6 }), -0.3 + (r() - 0.5) * 0.04, y + h / 2, 0, g); b.rotation.y = (r() - 0.5) * 0.3; y += h; }
    for (let i = 0; i < 5; i++) mesh(bx(0.24, 0.012, 0.32), M(i % 2 ? 0xefe7d4 : 0xe4d9c2), 0.3, 0.656 + i * 0.012, 0, g).rotation.y = (r() - 0.5) * 0.3;
    collide(3.4, 4.22, 1.35, 0.5); }
  /* framed travel map and a pinned page for decoration */
  framed(scene, tex(512, 384, drawIslandMap), 0.9, 0.68, 3.4, 2.0, 4.47, Math.PI, 0x2a1a10);
  { const m = plane(paperTex(91, 10, '#e8dfca'), 0.4, 0.53, true); m.position.set(-3.1, 1.9, 4.48); m.rotation.y = Math.PI; scene.add(m); }
}

function drawClock(t) {
  const { g } = clockTex.userData, w = 256, c = w / 2;
  g.clearRect(0, 0, w, w);
  g.fillStyle = '#efe7d6'; g.fillRect(0, 0, w, w);
  g.fillStyle = '#1a1a1a'; g.font = `600 28px ${SANS}`; g.textAlign = 'center'; g.textBaseline = 'middle';
  for (let i = 1; i <= 12; i++) { const a = i / 12 * TAU; g.fillText(String(i), c + Math.sin(a) * (c - 34), c - Math.cos(a) * (c - 34)); }
  const sec = 33 + t, m = 47 + sec / 60, h = 3 + m / 60;
  const hand = (a, len, wd, col = '#1a1a1a') => { g.strokeStyle = col; g.lineWidth = wd; g.lineCap = 'round'; g.beginPath(); g.moveTo(c, c); g.lineTo(c + Math.sin(a) * len, c - Math.cos(a) * len); g.stroke(); };
  hand(h / 12 * TAU, 52, 9); hand(m / 60 * TAU, 82, 6); hand(Math.floor(sec) / 60 * TAU, 90, 2, '#b0301c');
  g.fillStyle = '#b0301c'; g.beginPath(); g.arc(c, c, 6, 0, TAU); g.fill();
  clockTex.needsUpdate = true;
}
const MEMO = ['네 번의 \'포기\'를 하고,', '주변의 말을 들으니', '이젠 정답을 알 것 같다.'];
function drawBoard(u) {
  const { g } = boardTex.userData, w = 1024, h = 640;
  g.fillStyle = '#eef0ee'; g.fillRect(0, 0, w, h);
  const r = rng(12); for (let i = 0; i < 30; i++) { g.fillStyle = `rgba(80,90,110,${0.02 + r() * 0.04})`; g.beginPath(); g.ellipse(r() * w, r() * h, 40 + r() * 140, 10 + r() * 40, r() * 3, 0, TAU); g.fill(); }
  g.fillStyle = '#2a3a7a'; g.font = `64px ${HAND}`; g.textAlign = 'left'; g.textBaseline = 'alphabetic';
  g.fillText('TO DO', 40, 80);
  g.font = `46px ${HAND}`; ['☐ 6차 수정본', '☐ 편집자 미팅', '☐ 잠 좀 자기'].forEach((s, i) => g.fillText(s, 44, 150 + i * 56));
  g.strokeStyle = '#2a3a7a'; g.lineWidth = 4; g.beginPath(); g.moveTo(44, 270); g.lineTo(300, 260); g.stroke();
  if (u > 0) {
    const total = MEMO.join('').length, n = Math.floor(u * total + 0.0001); let used = 0;
    g.fillStyle = '#b01e1e'; g.font = `74px ${HAND}`;
    MEMO.forEach((line, i) => { const k = Math.max(0, Math.min(line.length, n - used)); used += line.length; if (k) g.fillText(line.slice(0, k), 360, 150 + i * 120); });
    if (u >= 1) { g.strokeStyle = '#b01e1e'; g.lineWidth = 5; g.beginPath(); g.moveTo(360, 540); g.lineTo(940, 530); g.stroke(); }
  }
  boardTex.needsUpdate = true;
}

/* ---------------------------------------------------------------- story scenes (pixel art) */
function makeScenes() {
  const pixG = api.pixG;
  const NAVY = '#161b2a';
  function room(t, o = {}) {
    const dawn = o.dawn || 0;
    P(NAVY, 0, 0, PW, PH);
    /* window */
    const sky = dawn ? pixG.createLinearGradient(0, 8, 0, 52) : null;
    if (sky) { sky.addColorStop(0, '#5a6aa8'); sky.addColorStop(1, '#ffb070'); pixG.fillStyle = sky; pixG.fillRect(104, 8, 60, 44); }
    else P('#070b16', 104, 8, 60, 44);
    for (let i = 0; i < 9; i++) { const bh = 8 + (i * 7) % 18; P(dawn ? '#3a2a40' : '#0e1424', 104 + i * 7, 52 - bh, 6, bh); if (!dawn) for (let y = 52 - bh + 2; y < 50; y += 4) if ((i + y) % 3 === 0) P('#f6c46a', 105 + i * 7, y, 1, 1); }
    if (dawn) { P('#ffe0a0', 150, 44 - Math.min(10, t * 3), 8, 6); }
    P('#3a2c20', 102, 6, 64, 2); P('#3a2c20', 102, 52, 64, 2); P('#3a2c20', 102, 6, 2, 48); P('#3a2c20', 164, 6, 2, 48); P('#3a2c20', 133, 6, 1, 48);
    /* cork board with papers */
    P('#6a4a2c', 14, 10, 78, 40);
    [[18, 14, 14, 18, '#e8dcc0'], [36, 16, 22, 14, '#d8cca8'], [62, 13, 12, 16, '#f2eadb'], [76, 20, 12, 12, '#f4d26a'], [22, 34, 18, 12, '#efe7d4'], [48, 33, 14, 14, '#e3d7bc'], [68, 36, 16, 10, '#f08a7a']].forEach(([x, y, w, h, c]) => { P(c, x, y, w, h); P('#c02a20', x + (w >> 1), y, 1, 1); });
    P('#a01818', 25, 15, 30, 1);
    /* desk */
    P('#5a3a20', 0, 70, PW, 5); P('#3a2414', 0, 75, PW, 33); P('#2a1a10', 0, 75, PW, 2);
  }
  function lampGlow(t) {
    pixG.fillStyle = 'rgba(255,190,100,.12)'; pixG.beginPath(); pixG.moveTo(150, 34); pixG.lineTo(118, 70); pixG.lineTo(186, 70); pixG.closePath(); pixG.fill();
    P('#141414', 160, 30, 2, 40); P('#141414', 148, 28, 14, 2); P('#111', 144, 30, 12, 5); P('#fff0c8', 147, 35, 6, 1);
  }
  function laptop(x, t, lines = 4, cursor = true, bright = '#dfe6f4') {
    P('#8a8e96', x, 50, 40, 20); P(bright, x + 2, 52, 36, 16);
    for (let i = 0; i < lines; i++) P('#8a92a8', x + 5, 55 + i * 3, 10 + ((i * 13) % 20), 1);
    if (cursor && Math.floor(t * 2) % 2 === 0) P('#111', x + 5 + 10 + ((lines * 13) % 20) % 20, 54 + lines * 3, 1, 3);
    P('#6a6e76', x - 4, 70, 48, 2);
  }
  function clock(x, y, t) { P('#1a1714', x, y, 12, 12); P('#efe7d6', x + 1, y + 1, 10, 10); P('#1a1a1a', x + 6, y + 3, 1, 3); P('#1a1a1a', x + 6, y + 6, 3, 1); if (Math.floor(t) % 2) P('#b0301c', x + 5, y + 6, 1, 1); }
  return {
    desk(t) {
      room(t); lampGlow(t); laptop(70, t, 2); clock(24, 58, t);
      P('#e8dfc8', 118, 64, 22, 6); P('#d8cfb8', 140, 66, 14, 4);
      kid(52, 60, '#2a3a5a', '#1a120c', t, { back: true });
      P('#3a2414', 49, 71, 14, 3); P('#3a2414', 50, 74, 2, 14); P('#3a2414', 60, 74, 2, 14);
      ptext('03:47', 30, 50, '#ffcf7a', 7);
    },
    review(t) {
      P('#1a1f2e', 0, 0, PW, PH);
      P('#efe7d4', 46, 6, 100, 98); P('#d8cfb8', 46, 6, 100, 2);
      ptext('TIME ISLAND', 96, 16, '#2a2016', 8);
      for (let i = 0; i < 12; i++) P('#9a927e', 56, 28 + i * 6, 50 + (i * 17) % 30, 1);
      const n = Math.min(6, Math.floor(t * 2.2));
      for (let i = 0; i < n; i++) { const y = 28 + ((i * 5) % 12) * 6; P('#c02020', 54, y, 70, 1); P('#c02020', 128 + (i % 2) * 4, y - 2, 4, 4); }
      if (t > 3) { const s = Math.min(1, (t - 3) * 3); pixG.globalAlpha = s; P('#c02020', 108, 74, 34, 18); P('#efe7d4', 110, 76, 30, 14); ptext('반려', 125, 83, '#c02020', 9); pixG.globalAlpha = 1; }
    },
    cliche(t) {
      room(t); lampGlow(t); laptop(70, t, 5, false, '#c8cede');
      for (let i = 0; i < 10; i++) { const a = t * 1.4 + i * 0.63, R = 30 + (i % 3) * 10; const x = 96 + Math.cos(a) * R * 1.5, y = 40 + Math.sin(a) * R * 0.6; P(i % 2 ? '#f2eadb' : '#e4d9c2', x, y, 8, 10); P('#9a927e', x + 1, y + 3, 5, 1); }
      const words = ['트렌드', '클리셰', '대중 입맛'];
      words.forEach((w, i) => { if (t > 0.8 + i * 0.8) ptext(w, 48 + i * 48, 22 + (i % 2) * 12, ['#ffcf7a', '#ff9a6a', '#cfd8ff'][i], 9); });
      kid(88, 62 + Math.min(4, t), '#2a3a5a', '#1a120c', t, {});
    },
    locked(t) {
      P(NAVY, 0, 0, PW, PH); P('#2a1e16', 0, 82, PW, 26);
      P('#4a3a2a', 128, 22, 40, 60); P('#3a2a20', 132, 26, 32, 56); P('#b89a60', 158, 54, 3, 3);
      const lit = Math.min(6, Math.floor(t * 1.6)); for (let i = 0; i < 6; i++) P(i < lit ? '#ff5a4a' : '#5a1a14', 132 + i * 6, 16, 3, 3);
      P('#ffcf7a', 144, 50, 6, 5); P('#ffcf7a', 145, 46, 1, 4); P('#ffcf7a', 148, 46, 1, 4); P('#ffcf7a', 145, 45, 4, 1);
      P('#5a3a20', 10, 66, 70, 4); P('#3a2414', 14, 70, 4, 12); P('#3a2414', 72, 70, 4, 12); P('#dfe6f4', 30, 56, 20, 10);
      kid(100 - Math.min(10, t * 3), 70, '#2a3a5a', '#1a120c', t, { back: true });
    },
    dawn(t) {
      room(t, { dawn: 1 }); laptop(70, t, 3, false, '#2a2e36');
      for (let i = 0; i < 10; i++) { const x = (i * 37 + t * 5) % PW, y = 10 + ((i * 53) % 40); P('rgba(255,230,170,.6)', x, y); }
      kid(52, 58, '#2a3a5a', '#1a120c', t, { armsUp: true, smile: true });
    },
    write(t) {
      room(t, { dawn: 1 }); lampGlow(t);
      const lines = Math.min(5, Math.floor(t * 2)); laptop(70, t, lines, true);
      const n = Math.min(5, Math.floor(t * 1.5)); for (let i = 0; i < n; i++) P(i % 2 ? '#f2eadb' : '#efe7d4', 120 + i * 2, 66 - i, 22, 2);
      ptext('TIME ISLAND', 96, 92, '#ffcf7a', 8);
      kid(52, 60, '#2a3a5a', '#1a120c', t, { back: true, bob: true });
      P('#3a2414', 49, 71, 14, 3); P('#3a2414', 50, 74, 2, 14); P('#3a2414', 60, 74, 2, 14);
    },
    walk(t) {
      const gr = pixG.createLinearGradient(0, 0, 0, PH); gr.addColorStop(0, '#4a6aa8'); gr.addColorStop(1, '#ffb070'); pixG.fillStyle = gr; pixG.fillRect(0, 0, PW, PH);
      P('#ffe8b0', 140, 30, 14, 14);
      for (let i = 0; i < 12; i++) { const bh = 20 + (i * 11) % 30; P('#2a2438', i * 17, 84 - bh, 15, bh); for (let y = 84 - bh + 3; y < 82; y += 5) if ((i + y) % 4 === 0) P('#ffd890', i * 17 + 3, y, 2, 2); }
      P('#2a2030', 0, 84, PW, 24); P('#4a3a40', 0, 84, PW, 1);
      kid(40 + Math.min(80, t * 14), 72, '#2a3a5a', '#1a120c', t, { smile: true });
      P('#efe7d4', 50 + Math.min(80, t * 14), 79, 4, 5);
    },
  };
}

BackStage.run({
  id: 'w3', week: 3, title: 'DESK', titleHTML: 'DESK<em>_</em>', tag: '게임 기획자의 새벽 작업실', docTitle: 'Desk',
  poster: 'assets/poster.webp', posterAlt: '밤의 작업실. 스탠드 불빛 아래 커다란 나무 책상, 노트북, TIME ISLAND 노트와 일기장, 벽에 붙은 지도와 메모',
  intro: ['커서 깜빡이는 것만 두 시간 째 보고 있다. 시간을 소재로 짠 게임 기획이 그렇게 별로였나.',
    '내 딴에는 꽤 그럴싸했는데 트렌드 지났다고 전개가 억지스럽다는 혹평에 한 달 노력이 통째로 날아갔다.',
    '내가 고집한 설정이 진짜 무리수였던 건지, 아니면 그냥 내가 감을 잃은 건지. 야심차게 짠 판인데 정작 내 아이디어는 다 까이고 결국 대중 입맛에 맞춰 뻔한 클리셰나 버무리고 앉아있다.',
    '이러려고 이 일 시작한 게 아닌데. 참 기운 빠지네.'],
  fonts: ['400 40px "Nanum Pen Script"', '400 40px "Special Elite"'],
  fontSample: 'TIME ISLAND PROTO #7 DOG KITE CASTLE concept FM 89.1 TO DO 섬(시간, 감옥) = ? (우편번호를 확인하시오.) 캐릭터 관계도 마감!! 마감 D-3 왜? 또 수정 설정 다시 원고 보관함 우편 출판 계약서 공모전 결과 안내 아쉽게도 6차 수정본 편집자 미팅 잠 좀 자기 네 번의 포기를 하고, 주변의 말을 들으니 이젠 정답을 알 것 같다.',
  sky: 0x07080d, fog: [9, 22], exposure: 1.0,
  player: { x: 0.2, z: 0.5, yaw: 0.0, pitch: -0.24 },
  bounds: [-4.65, 4.65, -4.15, 4.15],
  locks: LOCKS, clues: CLUES, related: RELATED, captions: CAPTIONS,
  cut: {
    L2: { at: [1.98, 0.86, -3.9], view: [1.55, 1.55, -2.65], color: 0xfae100 },
    L3: { at: [-4.42, 0.93, -0.52], view: [-3.0, 1.75, -0.35], color: 0xf2f2ee },
    L4: { at: [1.8, 1.5, 4.33], view: [1.6, 1.7, 2.6], color: 0x8cd0ff },
    L5: { at: [4.94, 1.85, -1.6], view: [3.0, 1.75, -1.45], color: 0xff6a5a },
    L6: { at: [-4.95, 2.78, -2.9], view: [-2.75, 2.0, -2.65], color: 0xff4a3a },
  },
  focus: {
    L1: [[-0.6, 3.6, -2.4], [-0.6, 0.85, -4.0]], L2: [[1.6, 3.6, -2.5], [2.0, 0.8, -3.95]], L3: [[-3.0, 3.6, -0.2], [-4.6, 0.9, -0.2]],
    L4: [[1.4, 3.6, 2.6], [1.4, 1.3, 4.35]], L5: [[3.3, 3.6, -1.6], [4.8, 1.2, -1.6]], L6: [[-3.0, 3.6, -2.9], [-4.7, 1.6, -2.9]],
    start: [[0, 3.6, -1.6], [0, 0.8, -3.85]],
  },
  focusIntensity: 0.7,
  prologue: [
    { scene: 'desk', text: '새벽 세 시 사십칠 분. 커서 깜빡이는 것만 두 시간 째 보고 있다.' },
    { scene: 'review', text: '시간을 소재로 한 달 동안 짠 게임 기획. 돌아온 건 혹평 한 줄이었다.' },
    { scene: 'cliche', text: '고집한 설정은 다 까이고, 남은 건 대중 입맛에 맞춘 뻔한 클리셰뿐.' },
    { scene: 'locked', text: '기운 빠져 일어서는데, 작업실 문이 잠겨 있다. 자물쇠 여섯 개를 풀고 이 방을 나가자.' },
  ],
  epilogue: [
    { scene: 'dawn', text: '마지막 자물쇠가 풀리자, 창밖이 밝아 오기 시작했다.' },
    { scene: 'write', text: '구겨 둔 설정 노트를 다시 펼쳤다. 내가 쓰고 싶던 이야기는 아직 여기 있다.' },
    { scene: 'walk', text: '혹평은 한 번의 판일 뿐. 다음 판은, 내 방식대로 짠다.' },
  ],
  scenes: makeScenes,
  exitCaption: '작업실 문이 열렸다. 복도 끝 창으로 새벽빛이 스민다.',
  finalGoal: '작업실 문이 풀렸습니다. 오른쪽 벽의 출구로 나가세요.',
  build() { buildRoom(); },
  animate(t, dt) {
    if (Math.floor(t) !== Math.floor(t - dt)) drawClock(Math.floor(t));
    if (laptopOpen) { const k = Math.floor(t * 1.9) % 2; if (laptopMat.map !== laptopDoc[k]) { laptopMat.map = laptopDoc[k]; laptopMat.needsUpdate = true; } }
    radioBars.forEach((b, i) => { const v = radioOn ? 0.3 + Math.abs(Math.sin(t * (5 + i * 1.7) + i)) * 0.9 : 0.15; b.scale.y = v; });
  },
  onSolved(L) {
    if (L.id === 'L1') { laptopOpen = true; laptopMat.map = laptopDoc[0]; laptopMat.needsUpdate = true; }
    if (L.id === 'L6') radioOn = false;
  },
});
})();
