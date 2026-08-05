// Phan loai cho Ngan hang cau hoi: Mon -> Khoi (6-9), roi loc theo Chu de/Bai
// (nhap tu do theo tung tai nguyen) va Dang cau/Muc do (bo gia tri co dinh).
// Them mon moi sau nay chi can them 1 dong vao RESOURCE_SUBJECTS.
export const RESOURCE_SUBJECTS = {
  tin_hoc: { label: 'Tin học' },
  hdtn: { label: 'HĐTN' },
  lap_trinh: { label: 'Lập trình' },
  robot: { label: 'Robot' },
}

export const RESOURCE_GRADES = {
  khoi_6: { label: 'Khối 6' },
  khoi_7: { label: 'Khối 7' },
  khoi_8: { label: 'Khối 8' },
  khoi_9: { label: 'Khối 9' },
}

// Trung voi dung "type" trong file de xuat tu tool Trac nghiem tuong tac
// (xem TYPE_LABELS trong trac-nghiem-tuong-tac.html) — de cau hoi parse tu file
// khop thang voi lua chon loc o day, khong can quy doi qua lai.
export const QUESTION_TYPE_LABELS = {
  single: 'Chọn 1 đáp án',
  multi: 'Chọn nhiều đáp án',
  order: 'Sắp xếp thứ tự',
  match: 'Nối cột',
  fillblank: 'Điền khuyết',
  dragdrop: 'Kéo thả',
}
export const QUESTION_TYPE_OPTIONS = Object.values(QUESTION_TYPE_LABELS)

// Trung voi BLOOM_LABELS trong tool soan (biet/hieu/vandung/vandungcao).
export const BLOOM_LABELS = {
  biet: 'Biết',
  hieu: 'Hiểu',
  vandung: 'Vận dụng',
  vandungcao: 'Vận dụng cao',
}
export const DIFFICULTY_LEVEL_OPTIONS = Object.values(BLOOM_LABELS)
